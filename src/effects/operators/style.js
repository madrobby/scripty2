//= require <effects/operators/base>

/**
 *  class S2.FX.Operators.Style < S2.FX.Operators.Base
 *  
 *  Operator for interpolating the CSS styles of an Element.
**/
S2.FX.Operators.Style = Class.create(S2.FX.Operators.Base, {
  initialize: function($super, effect, object, options) {
    $super(effect, object, options);
    this.element = $(this.object);

    this.style = Object.isString(this.options.style) ?
      S2.CSS.parseStyle(this.options.style) : this.options.style;

    var translations = this.options.propertyTransitions || {};

    this.tweens = [];
    
    for (var item in this.style) {
      var property = item.underscore().dasherize(),
       from = this.element.getStyle(property), to = this.style[item];
      
      if (from != to) {
        this.tweens.push([
          property,
          S2.CSS.interpolate.curry(property, from, to),
          item in translations ?
           Object.propertize(translations[item], S2.FX.Transitions) :
           Prototype.K
        ]);
      }
    }
  },

  valueAt: function(position) {
    return this.tweens.map( function(tween){
      return tween[0] + ':' + tween[1](tween[2](position));
    }).join(';');
  },

  applyValue: function(value) {
    if (this.currentStyle == value) return;
    this.element.setStyle(value);
    this.currentStyle = value;
  }
});