(function(FX) {

  Hash.addMethods({
    hasKey: function(key) {
      return (key in this._object);
    }
  });
  
  // Test if CSS transitions are supported.
  var supported = false;
  var hardwareAccelerationSupported = false;
  var transitionEndEventName = null;
  
  function isHWAcceleratedSafari() {
    var ua = navigator.userAgent, av = navigator.appVersion;
    return (!ua.include('Chrome') && av.include('10_6')) ||
     Prototype.Browser.MobileSafari;
  }
  
  (function() {
    var eventNames = {
      'WebKitTransitionEvent': 'webkitTransitionEnd',
      'TransitionEvent': 'transitionend'
    };
    if (S2.CSS.VENDOR.PREFIX) {
      var p = S2.CSS.VENDOR.PREFIX;
      eventNames[p + 'TransitionEvent'] = p + 'TransitionEnd';
    }
    
    for (var e in eventNames) {
      try {
        document.createEvent(e);
        transitionEndEventName = eventNames[e];
        supported = true;
        if (e == 'WebKitTransitionEvent') {
          hardwareAccelerationSupported = isHWAcceleratedSafari();
        }
        return;
      } catch (ex) { }
    }
  })();
  
  if (!supported) return;
  
  /**
   *  S2.Extensions.CSSTransitions = true | false
   * 
   *  This boolean variable states wheter or not CSS Transition
   *  support is available and enabled.
   *
   *  Setting this variable to `false` forces scripty2 to always
   *  use the JavaScript-based effects engine.
  **/
  
  Prototype.BrowserFeatures.CSSTransitions = true;
  S2.Extensions.CSSTransitions = true;
  S2.Extensions.HardwareAcceleratedCSSTransitions = hardwareAccelerationSupported;
  
  if (hardwareAccelerationSupported) {
    // Effects will try to hardware-accelerate by default.
    Object.extend(FX.DefaultOptions, { accelerate: true });
  }
  
  // Shortcut.
  function v(prop) {
    return S2.CSS.vendorizeProperty(prop);
  }
  
  var CSS_TRANSITIONS_PROPERTIES = $w(
   'border-top-left-radius border-top-right-radius ' +
   'border-bottom-left-radius border-bottom-right-radius ' +
   'background-size transform'
  ).map( function(prop) {
    return v(prop).camelize();
  });
  
  CSS_TRANSITIONS_PROPERTIES.each(function(property) {
    S2.CSS.PROPERTIES.push(property);
  });
  
  S2.CSS.NUMERIC_PROPERTIES = S2.CSS.PROPERTIES.findAll(function(property) {
    return !property.endsWith('olor') 
  });
  
  // Properties that we might be able to hardware-accelerate.
  CSS_TRANSITIONS_HARDWARE_ACCELERATED_PROPERTIES =
   S2.Extensions.HardwareAcceleratedCSSTransitions ? 
    $w('top left bottom right opacity') : [];

  var TRANSLATE_TEMPLATE = new Template("translate(#{0}px, #{1}px)");
  
  /** scripty2 ui
   *  class S2.FX.Operators.CssTransition < S2.FX.Operators.Base
   *  
   *  Operator for invoking CSS Transition-based CSS animations,
   *  bypassing the scripty2 effects engine and using 
   *  <a href="http://www.w3.org/TR/css3-transitions/">browser native CSS
   *  transitions</a>.
   *
   *  This class is only defined if running on a browser that supports
   *  CSS transitions and CSS transition events.
   *
   *  Because of limitations with CSS transitions, only a subset
   *  of the features of the full JavaScript-based effects engine
   *  is supported.
   *
   *    * Transitions are limited to 'linear' and 'sinusoidal' (default)
   *    * Some CSS properties can't be animated with CSS transitions
   *    * The propertyTransitions option is not supported
   *
   *  `S2.FX.Morph` will automatically detect if a non-supported feature
   *  is used and fall back to the JavaScript-based effects engine.
   *
   *  The use of the JavaScript engine can be forced by setting
   *  the `engine` option to 'javascript'.
   *
   *      $('element_id').morph('width:400px', { engine: 'javascript' });
   *
   *  You can query the [[S2.Extensions.CSSTransitions]] property
   *  to check if CSS transition support is enabled.
   *  
   *  #### Hardware acceleration
   *  
   *  In certain environments, the browser is able to use hardware 
   *  acceleration to deliver much smoother animations. Normally this is only
   *  available with [CSS transforms](http://bit.ly/8U2H3), since animation
   *  of any other property (even via CSS transitions) involves re-computing
   *  an element's layout with each frame of animation.
   *  
   *  The `CssTransition` operator circumvents this by converting
   *  certain property animations to their CSS-transform equivalents, if
   *  possible. For instance, animating the movement of an absolutely-
   *  positioned element can be expressed with a `translate` transformation,
   *  assuming the element's dimensions do not change.
   *  
   *  For more information on accelerated compositing, consult [this page on
   *  the WebKit wiki](http://bit.ly/9aq8CD).
   *  
   *  Currently, only these environments support hardware acceleration:
   *  
   *  * Safari 4.0 on OS X 10.6 (Snow Leopard)
   *  * MobileSafari on iPhone OS >= 3.0
   *  * Certain versions of [QtWebKit](http://trac.webkit.org/wiki/QtWebKit)
   *  
  **/
    
  var Operators = FX.Operators;
  
  Operators.CssTransition = Class.create(Operators.Base, {
    initialize: function($super, effect, object, options) {
      $super(effect, object, options);
      this.element = $(this.object);
      
      var style = this.options.style;
      
      this.style = Object.isString(style) ?
       S2.CSS.normalize(this.element, style) : style;
       
      this.style = $H(this.style);
      
      // Determine the ending CSS for the effect.
      this.targetStyle = S2.CSS.serialize(this.style);
      this.running = false;
    },
    
    // Tests if the effect can be hardware-accelerated. True if
    // the effect involves only opacity and motion -- specifically,
    // motion that _does not_ change the dimensions of the element being
    // moved, nor the dimensions of any of its ancestors. When those 
    // conditions are met, we can use a "translate" CSS transform instead
    // of updating the element's top/left/right/bottom properties.
    // 
    // For more information, consult:
    // http://trac.webkit.org/wiki/QtWebKitGraphics#Acceleratedcompositing
    _canHardwareAccelerate: function() {
      if (this.effect.options.accelerate === false) return false;
      
      var style = this.style.toObject(), keys = this.style.keys();
      var element = this.element;
      
      // If there are no properties to animate... something weird has
      // happened. Return `false` just to be safe.
      if (keys.length === 0) return false;
      
      // Can't hardware-accelerate if we're animating any style properties
      // other than the ones specified above.
      var otherPropertyExists = keys.any( function(key) {
        return !CSS_TRANSITIONS_HARDWARE_ACCELERATED_PROPERTIES.include(key);
      });
      
      if (otherPropertyExists) return false;
      
      var currentStyles = {
        left:   element.getStyle('left'),
        right:  element.getStyle('right'),
        top:    element.getStyle('top'),
        bottom: element.getStyle('bottom')
      };
      
      function hasTwoPropertiesOnSameAxis(obj) {
        if (obj.top && obj.bottom) return true;
        if (obj.left && obj.right) return true;
        return false;
      }
      
      // If either the existing styles or the destination styles feature two
      // CSS properties on the same axis (`left`/`right` or `top`/`bottom`),
      // that means the box's size will change as the element animates, and
      // therefore we can't hardware accelerate.
      if (hasTwoPropertiesOnSameAxis(currentStyles)) return false;
      if (hasTwoPropertiesOnSameAxis(style))         return false;
      
      // But if we made it this far, it's a go.
      return true;
    },
    
    // Converts the style hash into an equivalent style hash that uses the
    // "translate" CSS transform instead of animating top/bottom/left/right.
    _adjustForHardwareAcceleration: function(style) {
      var dx = 0, dy = 0;
      
      $w('top bottom left right').each( function(prop) {
        if (!style.hasKey(prop)) return;
        var current = window.parseInt(this.element.getStyle(prop), 10);
        var target  = window.parseInt(style.get(prop), 10);
        
        if (prop === 'top') {
          dy += (target - current);
        } else if (prop === 'bottom') {
          dy += (current - target);
        } else if (prop === 'left') {
          dx += (target - current);
        } else if (prop === 'right') {
          dx += (current - target);
        }
        
        style.unset(prop);
      }, this);
      
      var transformProperty = v('transform');
      
      if (dx !== 0 || dy !== 0) {
        var translation = TRANSLATE_TEMPLATE.evaluate([dx, dy]);
        style.set(transformProperty, translation);
      }
      
      this.targetStyle += transformProperty + ': translate(0px, 0px);';
      return style;
    },
    
    render: function() {
      if (this.running === true) return;
      var style = this.style.clone(), effect = this.effect;
      if (this._canHardwareAccelerate()) {
        effect.accelerated = true;
        style = this._adjustForHardwareAcceleration(style);        
      } else {
        effect.accelerated = false;
      }
      
      var s = this.element.style;
      
      var original = {};
      $w('transition-property transition-duration transition-timing-function').each( function(prop) {        
        prop = v(prop).camelize();
        original[prop] = s[prop];
      });
      
      // Store the targetStyle on the element so we can erase all evidence
      // of the `translate` call later.
      this.element.store('s2.targetStyle', this.targetStyle);
      
      // Also the original values for all `-VENDOR-transition-*` properties.
      this.element.store('s2.originalTransitionStyle', original);
      
      s[v('transition-property').camelize()] = style.keys().join(',');
      s[v('transition-duration').camelize()] = (effect.duration / 1000).toFixed(3) + 's';
      s[v('transition-timing-function').camelize()] = timingFunctionForTransition(effect.options.transition);
      
      // We make sure the browser interpreted the transitions properties
      // Opera needs deferring
      if (Prototype.Browser.Opera) {
        this._setStyle.bind(this).defer(style.toObject());
      } else this._setStyle(style.toObject());
      this.running = true;

      // Replace ourselves with a no-op.
      this.render = Prototype.emptyFunction;
    },
    
    _setStyle: function(style) {
      this.element.setStyle(style);
    }
  });
  
  Operators.CssTransition.TIMING_MAP = {
    linear:     'linear',
    sinusoidal: 'ease-in-out'
  };
  
  function timingFunctionForTransition(transition) {
    var timing = null, MAP = FX.Operators.CssTransition.TIMING_MAP;
    
    for (var t in MAP) {
      if (FX.Transitions[t] === transition) {
        timing = MAP[t];
        break;
      }
    }
    return timing;
  }  
  
  function isCSSTransitionCompatible(effect) {
    if (!S2.Extensions.CSSTransitions) return false;    
    var opt = effect.options;
    
    // Cancel if user explicitly opts into engine: 'javascript'.
    if ((opt.engine || '') === 'javascript') return false;

    // Complicated transitions can't be expressed in CSS.
    if (!timingFunctionForTransition(opt.transition)) return false;  

    // Can't animate different properties with different transitions.
    if (opt.propertyTransitions) return false;

    return true;
  };

  // Monkeypatch `S2.FX.Morph` to use the CSS transition operator.
  FX.Morph = Class.create(FX.Morph, {
    setup: function() {
      if (this.options.change) {
        this.setupWrappers();
      } else if (this.options.style) {
        this.engine  = 'javascript';
        var operator = 'style';
        
        // We have to "normalize" the given CSS to ensure that applying it
        // will result in some sort of style _change_ for the element.
        // Otherwise, trying to morph (e.g.) `left: 0px` to `left: 0px` would
        // fail to trigger a CSS transition, meaning the relevant events
        // wouldn't fire, meaning the effect would never fire its `after`
        // callback or get de-queued.
        var style = Object.isString(this.options.style) ?
         S2.CSS.parseStyle(this.options.style) : style;
         
        var normalizedStyle = S2.CSS.normalize(
         this.destinationElement || this.element, style);
         
        var changesStyle = Object.keys(normalizedStyle).length > 0;
        
        if (changesStyle && isCSSTransitionCompatible(this)) {
          // The effect can use CSS transitions.
          this.engine = 'css-transition';
          operator    = 'CssTransition';
          
          this.update = function(position) {
            // If we're using CSS transitions, we don't need a `render` method
            // to manage the state of the effect. Instead, we use the "transition
            // start" and "transition end" events to control state.
            this.element.store('s2.effect', this);

            S2.FX.setReady(this.element, false);

            for (var i = 0, operator; operator = this.operators[i]; i++) {
              operator.render(position);
            }

            // Replace `render` with a no-op.
            this.render = Prototype.emptyFunction;
          }
        }
        
        this.animate(operator, this.destinationElement || this.element, {
          style: this.options.style,
          propertyTransitions: this.options.propertyTransitions || { }
        });
      }
    }
  });
  
  // We listen for the `transitionEnd` event that fires when a CSS transition
  // is done, so that we can mark the effect as "finished," fire the `after`
  // callback, and do other custodial tasks.
  document.observe(transitionEndEventName, function(event) {
    var element = event.element();
    if (!element) return;
    
    // We make sure the element which dispatched the event
    // has an effect attached to it.
    var effect = element.retrieve('s2.effect');
    
    if (!effect || effect.state === 'finished') return;
    
    function adjust(element, effect){
      var targetStyle = element.retrieve('s2.targetStyle');
      if (!targetStyle) return;
      
      element.setStyle(targetStyle);
      
      var originalTransitionStyle = element.retrieve('s2.originalTransitionStyle');
      
      var storage = element.getStorage();
      storage.unset('s2.targetStyle');
      storage.unset('s2.originalTransitionStyle');
      storage.unset('s2.effect');
      
      if (originalTransitionStyle) {
        element.setStyle(originalTransitionStyle);
      }
      S2.FX.setReady(element);
    } 
    
    // Make sure the duration is properly reset after each transition.
    // NOTE: This was previously wrapped in an anonymous function and
    // deferred, but now it appears to work (in Safari 5, Chrome, and
    // Minefield) without needing this.
    var durationProperty = v('transition-duration').camelize();
    element.style[durationProperty] = '';
    adjust(element, effect);
    
    // Mark the effect as finished so it gets removed from its queue.
    effect.state = 'finished';
    
    // Fire the `after` callback.
    var after = effect.options.after;
    if (after) after(effect);    
  });
})(S2.FX);