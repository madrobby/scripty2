(function(FX) {

  Hash.addMethods({
    hasKey: function(key) {
      return (key in this._object);
    }
  });
  
  // Test if WebKit CSS transitions are supported.
  try {
    document.createEvent("WebKitTransitionEvent");
  } catch(e) {
    return;
  }  
  
  /**
   *  S2.Extensions.WebkitCSSTransitions = true | false
   * 
   *  This boolean variable states wheter or not WebKit CSS Transition
   *  support is available and enabled.
   *
   *  Setting this variable to `false` forces scripty2 to always
   *  use the JavaScript-based effects engine.
  **/
  
  Prototype.BrowserFeatures.WebkitCSSTransitions = true;
  S2.Extensions.webkitCSSTransitions = true;
  
  CSS_TRANSITIONS_PROPERTIES = $w(
   'webkitBorderTopLeftRadius webkitBorderTopRightRadius ' +
   'webkitBorderBottomLeftRadius webkitBorderBottomRightRadius ' +
   'webkitBackgroundSize'
  );
  
  // Properties that we might be able to hardware-accelerate.
  CSS_TRANSITIONS_HARDWARE_ACCELERATED_PROPERTIES =
   $w('top left bottom right opacity');

  var TRANSLATE_TEMPLATE = new Template("translate(#{0}px, #{1}px)");
  
  /** scripty2 ui
   *  class S2.FX.Operators.WebkitCssTransition < S2.FX.Operators.Base
   *  
   *  Operator for invoking WebKit CSS Transition-based CSS animations,
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
   *  S2.FX.Morph will automatically detect if a non-supported feature
   *  is used and fall back to the JavaScript-based effects engine.
   *
   *  The use of the JavaScript engine can be forced by setting
   *  the `engine` option to 'javascript'.
   *
   *      $('element_id').morph('width:400px', { engine: 'javascript' });
   *
   *  You can query the [[S2.Extensions.webkitCSSTransitions]] property
   *  to check if WebKit CSS transition support is enabled.
   *  
   *  #### Hardware acceleration
   *  
   *  In certain environments, the browser is able to use hardware 
   *  acceleration to deliver much smoother animations. Normally this is only
   *  available with [CSS transforms](http://bit.ly/8U2H3), since animation
   *  of any other property (even via CSS transitions) involves re-computing
   *  an element's layout with each frame of animation.
   *  
   *  The `WebkitCssTransition` operator circumvents this by converting
   *  certain property animations to their CSS-transform equivalents, if
   *  possible. For instance, animating the movement of an absolutely-
   *  positioned element can be expressed with a `translate` transformation,
   *  assuming the element's dimensions do not change.
   *  
   *  For more information on accelerated compositing, consult [this page on
   *  the WebKit wiki](http://bit.ly/9aq8CD).
   *  
   *  Currently, only two environments support hardware acceleration:
   *  
   *  * Safari 4.0 on OS X 10.6 (Snow Leopard)
   *  * MobileSafari on iPhone OS >= 3.0
   *  
  **/
    
  var Operators = FX.Operators;
  
  Operators.WebkitCssTransition = Class.create(Operators.Base, {
    initialize: function($super, effect, object, options) {
      $super(effect, object, options);
      this.element = $(this.object);
      
      if (!Object.isString(this.options.style)) {
        // We've been given an object full of CSS property/value pairs.
        this.style = $H(this.options.style);
      } else {
        if (this.options.style.include(':')) {
          // We've been given a CSS string.
          this.style = $H(S2.CSS.parseStyle(this.options.style));
        } else {
          // We've been given a class name. Compare the styles before and
          // after the class name is applied, then keep only those styles
          // that are different.
          this.element.addClassName(options.style);
          var after = this.element.getStyles();
          this.element.removeClassName(options.style);          
          var before = this.element.getStyles();          
          this.style = $H(after).reject( function(style) {
            return style.value === css[style.key];
          });
        }
      }
      
      // Determine the ending CSS for the effect.
      var targetStyle = '';
      this.style.each( function(pair) {
        var property = pair.key.underscore().dasherize();
        if (property.startsWith('webkit')) property = '-' + property;
        targetStyle += ';' + property + ':' + pair.value;
      });

      this.targetStyle = targetStyle;
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
      var style = this.style.toObject(), keys = this.style.keys();
      var element = this.element;
      
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
      
      if (dx !== 0 || dy !== 0) {
        var translation = TRANSLATE_TEMPLATE.evaluate([dx, dy]);
        style.set('webkitTransform', translation);
      }
      
      this.targetStyle += ';-webkit-transform: translate(0px, 0px);';
      return style;
    },
    
    render: function() {
      var style = this.style.clone(), effect = this.effect;
      if (this._canHardwareAccelerate()) {
        style = this._adjustForHardwareAcceleration(style);
      }
      
      var s = this.element.style;
      
      s.webkitTransitionProperty = style.keys().join(',');        
      s.webkitTransitionDuration = (effect.duration / 1000).toFixed(3) + 's';
      s.webkitTransitionTimingFunction =
       timingFunctionForTransition(effect.options.transition);
       
      style.each( function(pair) {
        var property = pair.key.camelize();
        s[property] = pair.value;
      });
      
      // Store the targetStyle on the element so we can erase all evidence
      // of the `translate` call later.
      this.element.store('s2.targetStyle', this.targetStyle);
      
      // Replace ourselves with a no-op.
      this.render = Prototype.emptyFunction;
    }
  });
  
  function timingFunctionForTransition(transition) {
    var timing = null, MAP = S2.FX.Operators.WebkitCssTransition.TIMING_MAP;
    
    for (var t in MAP) {
      if (S2.FX.Transitions[t] === transition) {
        timing = MAP[t];
        break;
      }
    }
    return timing;
  }
  
  
  function isWebkitCSSTransitionCompatible(effect){
    if (!S2.Extensions.webkitCSSTransitions) return false;    
    var opt = effect.options;
    
    // Cancel if user explicitly opts into engine: 'javascript'.
    if ((opt.engine || '') === 'javascript') return false;

    // Complicated transitions can't be expressed in CSS.
    if (!timingFunctionForTransition(opt.transition)) return false;  

    // Can't animate different properties with different transitions.
    if (opt.propertyTransitions) return false;

    return true;
  };

  // Monkeypatch `S2.FX.Morph` to use the CSS transition operator if
  // possible.
  S2.FX.Morph = Class.create(S2.FX.Morph, {
    setup: function() {
      if (this.options.change) {
        this.setupWrappers();
      } else if (this.options.style) {
        this.engine  = 'javascript';
        var operator = 'style';
        if (isWebkitCSSTransitionCompatible(this)) {
          this.engine = 'webkit';
          operator    = 'webkitCssTransition';
        }
        
        this.animate(operator, this.destinationElement || this.element, {
          style: this.options.style,
          propertyTransitions: this.options.propertyTransitions || { }
        });
      }
    },

    render: function($super, position) {
      if (this.engine === 'webkit') {
        this.element.store('s2.effect', this);

        if (this.options.before) {
          this.element.store('s2.beforeStartEffect', this.options.before);
        }

        if (this.options.after) {
          this.element.store('s2.afterFinishEffect', this.options.after);
          delete this.options.after;
        }
        
        // Replace ourselves with a no-op.
        this.render = Prototype.emptyFunction;
      }
      return $super(position);
    }
  });
  
  S2.FX.webkitTransitionStartEvent = 
  document.observe('webkitTransitionStart', function(event) {
    var element = event.element();
    if (!element) return;
    
    var before = element.retrieve('s2.beforeStartEffect');
    element.store('s2.beforeStartEffect', null);
    
    if (before) before();
  });
  
  S2.FX.webkitTransitionEndEvent = 
  document.observe('webkitTransitionEnd', function(event) {
    var element = event.element();
    if (!element) return;

    function adjust() {
      var targetStyle = element.retrieve('s2.targetStyle');
      if (!targetStyle) return;
      element.setStyle(targetStyle);
    }
    
    // Make sure the duration is properly reset after each transition.
    // The next line crashes current WebKit if not called deferred.
    // (reported as https://bugs.webkit.org/show_bug.cgi?id=22398)
    (function (){
      element.style.webkitTransitionDuration = '';
      
      // We need to defer this call because we've just set
      // webkitTransitionDuration to 0, but it won't take effect until
      // the stack is empty (because of style batching).
      adjust.defer();
    }).defer();
    
    var after = element.retrieve('s2.afterStartEffect');
    element.store('s2.afterStartEffect', null);
    if (after) after();    
  });

  S2.FX.Operators.WebkitCssTransition.TIMING_MAP = {
    linear:     'linear',
    sinusoidal: 'ease-in-out'
  };
})(S2.FX);