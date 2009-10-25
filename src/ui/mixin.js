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

/**
 *  S2.UI.Mixin
**/
S2.UI.Mixin = {};

/**
 *  mixin S2.UI.Mixin.Configurable
 *  
 *  A mixin for hassle-free blending of default options with user-defined
 *  options.
 *  
 *  Expects default options to be defined in a `DEFAULT_OPTIONS` property
 *  on the class itself.
**/
S2.UI.Mixin.Configurable = {
  /**
   *  S2.UI.Mixin.Configurable#setOptions(options) -> Object
   *  - options (Object): A set of user-defined options that should override
   *    the defaults.
   *  
   *  Sets options on the class.
  **/
  setOptions: function(options) {
    if (!this.options) {
      this.options = {};
      var constructor = this.constructor;    
      if (constructor.superclass) {
        // Build the inheritance chain.
        var chain = [], klass = constructor;
        while (klass = klass.superclass)
          chain.push(klass);
        chain = chain.reverse();

        for (var i = 0, l = chain.length; i < l; i++)
          Object.deepExtend(this.options, chain[i].DEFAULT_OPTIONS || {});
      }

      Object.deepExtend(this.options, constructor.DEFAULT_OPTIONS || {});
    }
    return Object.deepExtend(this.options, options || {});
  }
};

/**
 *  mixin S2.UI.Mixin.Trackable
**/
S2.UI.Mixin.Trackable = {
  register: function() {
    var klass = this.constructor;
    if (!klass.instances) {
      klass.instances = [];
    }
    if (!klass.instances.include(this)) {
      klass.instances.push(this);      
    }
    
    if (Object.isFunction(klass.onRegister)) {
      klass.onRegister.call(klass, this);
    }
  },
  
  unregister: function() {
    var klass = this.constructor;
    klass.instances = klass.instances.without(this);
    if (Object.isFunction(klass.onRegister)) {
      klass.onUnregister.call(klass, this);
    }
  }
};