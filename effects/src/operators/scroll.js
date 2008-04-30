Effect.Operators.Scroll = Class.create(Effect.Operators.Base, {
  initialize: function($super, object, options) {
    $super(object, options);
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