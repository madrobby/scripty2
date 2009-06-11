//= require <effects/operators/base>

/**
 *  class s2.fx.Operators.Scroll < s2.fx.Operators.Base
 *  
 *  Operator for scrolling the contents of an Element.
**/
s2.fx.Operators.Scroll = Class.create(s2.fx.Operators.Base, {
  initialize: function($super, effect, object, options) {
    $super(effect, object, options);
    this.start = object.scrollTop;
    this.end = this.options.scrollTo;
  },

  valueAt: function(position) {
    return this.start + ((this.end - this.start)*position);
  },

  applyValue: function(value){
    this.object.scrollTop = value.round();
  }
});