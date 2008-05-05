Effect.Operators = { };

Effect.Operators.Base = Class.create({
  initialize: function(object, options) {
    this.object = object;
    this.options = Object.extend({
      transition: Prototype.K
    }, options);
  },

  inspect: function() {
    return "#<Effect.Operators.Base:" + this.lastValue + ">";
  },

  render: function(position) {
    var value = this.valueAt(this.options.transition(position));
    this.applyValue(value);
    this.lastValue = value;
  }
});