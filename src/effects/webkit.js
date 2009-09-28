Prototype.BrowserFeatures.WebkitCSSTransitions = false;
S2.Extensions.webkitCSSTransitions = false;

(function(){
  // test if WebKit CSS transitions are supported
  //try {
  //  document.createEvent("WebKitTransitionEvent");
  //} catch(e) {
  //  return;
  //}
  
  /**
   *  S2.Extensions.webkitCSSTransitions = true | false
   * 
   *  This boolean variable states wheter or not WebKit CSS Transition
   *  support is available and enabled.
   *
   *  Setting this variable to `false` forces scripty2 to always
   *  use the JavaScript-based effects engine.
  **/
  Prototype.BrowserFeatures.WebkitCSSTransitions = true;
  S2.Extensions.webkitCSSTransitions = true;

  if (Prototype.BrowserFeatures.WebkitCSSTransitions) {
    // add webkit properties
    $w('webkitBorderTopLeftRadius webkitBorderTopRightRadius '+
       'webkitBorderBottomLeftRadius webkitBorderBottomRightRadius '+
       'webkitBackgroundSize').each(function(property){
      S2.CSS.PROPERTIES.push(property);  
    });
    S2.CSS.NUMERIC_PROPERTIES = 
      S2.CSS.PROPERTIES.findAll(function(property){ 
        return !property.endsWith('olor') 
      });
      
    /**
     *  class S2.FX.Operators.WebkitCssTransition < S2.FX.Operators.Base
     *  
     *  Operator for invoking WebKit CSS Transition-based CSS animations,
     *  bypassing the scripty2 effects engine and using 
     *  <a href="http://www.w3.org/TR/css3-transitions/">browser native CSS transitions</a>.
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
    **/
    S2.FX.Operators.WebkitCssTransition = Class.create(S2.FX.Operators.Base, {
      initialize: function($super, effect, object, options) {
        $super(effect, object, options);
        this.element = $(this.object);  
        if (!Object.isString(this.options.style)) {
          this.style = $H(this.options.style);
        } else {
          if (this.options.style.include(':')) {
            this.style = $H(S2.CSS.parseStyle(this.options.style));

          } else {
            this.element.addClassName(options.style);
            this.style = $H(this.element.getStyles());
            this.element.removeClassName(options.style);

            var css = this.element.getStyles();
            this.style = this.style.reject(function(style) { return style.value == css[style.key] });
          }
        }
        this.properties = [];
        this.targetStyle = '';

        this.style.each(function(pair) {
          var property = pair[0].underscore().dasherize(), target = pair[1], unit = '',
            source = this.element.getStyle(property), tween = '';

          if(property.startsWith('webkit')) property = '-' + property;

          this.properties.push(property);
          this.targetStyle += ';'+property+':'+target;
        }, this);
      },

      render: function(){
        this.element.style.webkitTransitionProperty = this.properties.join(',');
        this.element.style.webkitTransitionDuration = (this.effect.duration/1000).toFixed(3)+'s';

        for(t in S2.FX.Operators.WebkitCssTransition.TIMING_MAP)
          if(S2.FX.Transitions[t] === this.effect.options.transition)
            this.element.style.webkitTransitionTimingFunction = 
              S2.FX.Operators.WebkitCssTransition.TIMING_MAP[t];

        this.element.setStyle(this.targetStyle);
        this.render = Prototype.emptyFunction;
      }
    });
    
    S2.FX.Operators.WebkitCssTransition.TIMING_MAP = {
      linear: 'linear',
      sinusoidal: 'ease-in-out'
    };
    
    timingFunctionForTransition = function(transition){
      var timing = null;
      for(t in S2.FX.Operators.WebkitCssTransition.TIMING_MAP)
        if(S2.FX.Transitions[t] === transition)
          timing = S2.FX.Operators.WebkitCssTransition.TIMING_MAP[t];
      return timing;
    };
    
    isWebkitCSSTransitionCompatible = function(effect){
      return (S2.Extensions.webkitCSSTransitions &&
        !((effect.options.engine||'')=='javascript') &&
        (timingFunctionForTransition(effect.options.transition)) &&
        !(effect.options.propertyTransitions));
    };
    
    S2.FX.Morph = Class.create(S2.FX.Morph, {
      setup: function(){
        if (this.options.change) 
          this.setupWrappers();
        else if (this.options.style)
          this.animate(isWebkitCSSTransitionCompatible(this) ? 
            'webkitCssTransition' : 'style', this.destinationElement || this.element, { 
            style: this.options.style,
            propertyTransitions: this.options.propertyTransitions || { }
          });
      },
      render: function($super, position){
        if(S2.Extensions.webkitCSSTransitions){
          if(this.options.before)
            this.element.beforeStartEffect = this.options.before;

          if(this.options.after) {
            this.element.afterFinishEffect = this.options.after;
            delete this.options.after;
          }

          this.element._effect = this;
        }
        return $super(position);
      }
    });

    Element.addMethods({
      morph: function(element, style, options){
        if (Object.isNumber(options)) options = { duration: options };
        return element.effect('morph', Object.extend(options, {style: style}));
      }.optionize()
    });

    S2.FX.webkitTransitionStartEvent = 
    document.observe('webkitTransitionStart', function(event){
      var element = event.element();
      if(!element || !element.beforeStartEffect) return;
      element.beforeStartEffect();
      element.beforeStartEffect = null;
    });
    
    S2.FX.webkitTransitionEndEvent = 
    document.observe('webkitTransitionEnd', function(event){
      var element = event.element();
      if(!element) return;
      // mobile safari doesn't auto-reset the duration, so follow-up setStyle always animate.
      // make sure the duration is properly reset after each transition
      // the next line crashes current WebKit if not called deferred
      // reported as https://bugs.webkit.org/show_bug.cgi?id=22398
      (function(){ element.style.webkitTransitionDuration = ''; }).defer();
      if(!element.afterFinishEffect) return;
      element.afterFinishEffect();
      element.afterFinishEffect = null;
    });
  }  
})();