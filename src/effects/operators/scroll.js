//= require <effects/operators/base>

/**
 *  class S2.FX.Operators.Scroll < S2.FX.Operators.Base
 *  
 *  Operator for scrolling the contents of an Element.
**/
S2.FX.Operators.Scroll = Class.create(S2.FX.Operators.Base, {
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