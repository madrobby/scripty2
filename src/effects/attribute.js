/** section: scripty2 fx
 *  class S2.FX.Attribute < S2.FX.Base
 *
 *  This effect can change an object property or call
 *  a method with a numerical interpolation.
**/
S2.FX.Attribute = Class.create(S2.FX.Base, {
  initialize: function($super, object, from, to, options, method) {
    object = Object.isString(object) ? $(object) : object;

    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) : 
      function(value) { object[method] = value };

    this.to = to;
    this.from = from;

    return $super(options);
  },

  update: function(position) {
    this.method(this.from.tween(this.to, position));
  }
});