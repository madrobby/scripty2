//= require <effects/operators/base>

/**
 *  class s2.fx.Operators.Style < s2.fx.Operators.Base
 *  
 *  Operator for interpolation the CSS styles of an Element.
**/
s2.fx.Operators.Style = Class.create(s2.fx.Operators.Base, {
  initialize: function($super, effect, object, options) {
    $super(effect, object, options);
    this.element = $(this.object);

    this.style = Object.isString(this.options.style) ? 
      s2.css.parseStyle(this.options.style) : this.options.style;

    this.tweens = [];
    for(var item in this.style){
      var property = item.underscore().dasherize(),
        from = this.element.getStyle(property), to = this.style[item];
      if(from!=to)
        this.tweens.push([property, s2.css.interpolate.curry(property, from, to)]);
    }
  },

  valueAt: function(position) {
    return this.tweens.map( function(tween){
      return tween[0]+':'+tween[1](position);
    }).join(';')
  },

  applyValue: function(value) {
    if(this.currentStyle == value) return;
    this.element.setStyle(value);
    this.currentStyle = value;
  }
});