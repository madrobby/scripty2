/**
 *  S2.deepExtend(destination, source) -> Object
 *  
 *  A "deep" version of `Object.extend`. Performs a recursive deep extension.
 *  
 *  Used within Krang to blend user-set options with the defaults.
**/

S2.deepExtend = function(destination, source) {
  for (var property in source) {
    var type = typeof source[property], deep = true;
    
    if (source[property] === null || type !== 'object')
      deep = false;
      
    if (Object.isElement(source[property]))
      deep = false;
      
    if (source[property] && source[property].constructor &&
     source[property].constructor !== Object) {
      deep = false;
    } 
        
    if (deep) {
      destination[property] = destination[property] || {};
      arguments.callee(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }    
  }
  return destination;
};

S2.Mixin = {};

/**
 *  mixin S2.Mixin.Configurable
 *  
 *  A mixin for hassle-free blending of default options with user-defined
 *  options.
 *  
 *  Expects default options to be defined in a `DEFAULT_OPTIONS` property
 *  on the class itself.
**/
S2.Mixin.Configurable = {
  /**
   *  S2.Mixin.Configurable#setOptions(options) -> Object
   *  - options (Object): A set of user-defined options that should override
   *    the defaults.
   *  
   *  Sets options on the class.
  **/
  setOptions: function(options) {
    this.options = {};
    var constructor = this.constructor;
    
    if (constructor.superclass) {
      // Build the inheritance chain.
      var chain = [], klass = constructor;
      while (klass = klass.superclass)
        chain.push(klass);
      chain = chain.reverse();
      
      for (var i = 0, l = chain.length; i < l; i++)
        S2.deepExtend(this.options, chain[i].DEFAULT_OPTIONS || {});
    }
    
    S2.deepExtend(this.options, constructor.DEFAULT_OPTIONS || {});
    return S2.deepExtend(this.options, options || {});
  }
};


Function.prototype.optionize = function(){
  var self = this, argumentNames = self.argumentNames(), optionIndex = argumentNames.length - 1, 
    method = function(){
    var args = $A(arguments), options = typeof args.last() == 'object' ? args.pop() : {},
      prefilledArgs = (optionIndex == 0 ? [] : 
        ((args.length > 0 ? args : [null]).inGroupsOf(optionIndex).flatten())).concat(options);
    return self.apply(this, prefilledArgs);
  };
  method.argumentNames = function(){ return argumentNames };
  return method;
};

/** section: scripty2 core
 * class Number
 *  
 *  Extensions to the built-in `Number` object.
**/

/**
 *  Number#tween(target, position) -> Number
 *  - target (Number): tween target
 *  - position (Number): position between 0 (start of tween) and (end of tween); can also be < 0 and > 1.
 *
 *  Returns the number that is a given percentage between this number and a target number.
 *
 *      (1).tween(2, 0.5) -> 1.5
 *      (1).tween(2, 0) -> 1
 *      (1).tween(2, 1) -> 2
**/
Number.prototype.tween = function(target, position){
  return this + (target-this) * position;
};

Object.propertize = function(property, object){
  return Object.isString(property) ? object[property] : property;
};