/**
 * S2.FX.Operators
 *  
 * Effect operators are reusable interpolation functions.
 * Operators are used by [[S2.FX.Element]] and its subclasses.
**/
S2.FX.Operators = { };

/**
 *  class S2.FX.Operators.Base
 *  
 *  This is a skeleton base class which must be extended to be useful.
**/
S2.FX.Operators.Base = Class.create({
  /**
   *  new S2.FX.Operators.Base(effect, object[, options])
   *  - effect (S2.FX.Effect): The effect which uses this operator
   *  - object (Object): A releatd object (mostly elements)
   *  - options (Object): Additional options for the operator.
   *  
   *  This is a skeleton base class which must be extended to be useful.
   *
   *  Options:
   *    * `transition`: a [[S2.FX.Transition]] method, defaults to a linear transition
  **/
  initialize: function(effect, object, options) {
    this.effect = effect;
    this.object = object;
    this.options = Object.extend({
      transition: Prototype.K
    }, options);
  },

  /**
   *  S2.FX.Operators.Base#inspect() -> String
   *  
   *  Returns the debug-oriented string representation of an S2.FX.Operator.
  **/
  inspect: function() {
    return "#<S2.FX.Operators.Base:" + this.lastValue + ">";
  },
  
  /**
   *  S2.FX.Operators.Base#setup() -> undefined
   *  
   *  Called when the operator is intialized.
   *  Intended to be overridden by subclasses.
  **/
  setup: function() {
  },
  
  /**
   *  S2.FX.Operators.Base#valueAt(position) -> Object
   *  - position (Number): position between 0 (start of operator) and 1 (end of operator)
   *  
   *  Returns the value for a specific position.
   *  Needs to be overridden by subclasses.
  **/
  valueAt: function(position) {
  },
  
  /**
   *  S2.FX.Operators.Base#applyValue(value) -> undefined
   *  - value (Object): value to be rendered
   * 
   *  Needs to be overridden by subclasses.
  **/
  applyValue: function(value) {
  },

  /**
   *  S2.FX.Operators.Base#render() -> undefined
   *  
   *  Renders the Operator. This method is called by [[S2.FX.Element#animate]].
  **/
  render: function(position) {
    var value = this.valueAt(this.options.transition(position));
    this.applyValue(value);
    this.lastValue = value;
  }
});