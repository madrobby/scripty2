/**
 * s2.fx.Operators
 *  
 * Effect operators are reusable interpolation functions.
 * Operators are used by [[s2.fx.Element]] and it's subclasses.
**/
s2.fx.Operators = { };

/**
 *  class s2.fx.Operators.Base
 *  
 *  This is skeleton base class which must be extended to be useful.
**/
s2.fx.Operators.Base = Class.create({
  /**
   *  new s2.fx.Operators.Base(effect, object[, options])
   *  - effect (s2.fx.Effect): The effect which uses this operator
   *  - object (Object): A releatd object (mostly elements)
   *  - options (Object): Additional options for the operator.
   *  
   *  This is skeleton base class which must be extended to be useful.
   *
   *  Options:
   *    * `transition`: a [[s2.fx.Transition]] method, defaults to a linear transition
  **/
  initialize: function(effect, object, options) {
    this.effect = effect;
    this.object = object;
    this.options = Object.extend({
      transition: Prototype.K
    }, options);
  },

  /**
   *  s2.fx.Operators.Base#inspect() -> String
   *  
   *  Returns the debug-oriented string representation of an s2.fx.Operator.
  **/
  inspect: function() {
    return "#<s2.fx.Operators.Base:" + this.lastValue + ">";
  },
  
  /**
   *  s2.fx.Operators.Base#setup() -> undefined
   *  
   *  Called when the operator is intialized.
   *  Intended to be overridden by subclasses.
  **/
  setup: function() {
  },
  
  /**
   *  s2.fx.Operators.Base#valueAt(position) -> Object
   *  - position (Number): position between 0 (start of operator) and 1 (end of operator)
   *  
   *  Returns the value for a specific position.
   *  Needs to be overridden by subclasses.
  **/
  valueAt: function(position) {
  },
  
  /**
   *  s2.fx.Operators.Base#applyValue(value) -> undefined
   *  - value (Object): value to be rendered
   * 
   *  Needs to be overridden by subclasses.
  **/
  applyValue: function(value) {
  },

  /**
   *  s2.fx.Operators.Base#render() -> undefined
   *  
   *  Renders the Operator. This method is called by [[s2.fx.Element#animate]].
  **/
  render: function(position) {
    var value = this.valueAt(this.options.transition(position));
    this.applyValue(value);
    this.lastValue = value;
  }
});