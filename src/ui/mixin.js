/**
 *  Object.deepExtend(destination, source) -> Object
 *  
 *  A "deep" version of `Object.extend`. Performs a recursive deep extension.
**/

Object.deepExtend = function(destination, source) {
  for (var property in source) {
    if (source[property] && source[property].constructor &&
     source[property].constructor === Object) {
      destination[property] = destination[property] || {};
      arguments.callee(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
};

/** section: scripty2 ui
 * S2.UI.Mixin
**/
S2.UI.Mixin = {};

//= require "mixin/configurable"
//= require "mixin/trackable"
//= require "mixin/element"

//= require "mixin/shim"