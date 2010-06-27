
/** section: scripty2 ui
 *  mixin S2.UI.Mixin.Trackable
**/
S2.UI.Mixin.Trackable = {
  /**
   *  S2.UI.Mixin.Trackable.register() -> undefined
  **/
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
  
  /**
   *  S2.UI.Mixin.Trackable.unregister() -> undefined
  **/
  unregister: function() {
    var klass = this.constructor;
    klass.instances = klass.instances.without(this);
    if (Object.isFunction(klass.onRegister)) {
      klass.onUnregister.call(klass, this);
    }
  }
};