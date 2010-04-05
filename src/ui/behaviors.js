/** section: scripty2 ui
 *  class S2.UI.Behavior
 *  
 *  Abstract base class for assigning sets of events.
 *  
 *  <h4>Usage</h4>
 *  
 *  Certain special functions in a behavior class are used directly as event
 *  handlers. They follow one of two naming conventions:
 *  
 *    * `on` followed by an event name, as in `onscroll`;
 *    * an arbitrary identifier, a slash (`/`), then the pattern above, as in
 *      `panel/onscroll`.
 *  
 *  The former will be attached to the element assigned to `this.element`.
 *  The latter will be attached to the element assigned to `this.foo`, where
 *  `foo` is the part before the slash.
 *  
 *  Arbitrary properties (like `this.foo`) are designated by the `options`
 *  argument of the constructor.
 *  
**/
S2.UI.Behavior = Class.create(S2.UI.Mixin.Configurable, {
  /**
   *  new S2.UI.Behavior(element, options)
  **/
  initialize: function(element, options) {
    this.element = element;
    this.setOptions(options);
    
    Object.extend(this, options);

    this._observers = {};
    
    function isEventHandler(eventName) {
      return eventName.startsWith('on') || eventName.include('/on');
    }
    
    var parts, element, name, handler;
    for (var eventName in this) {
      if (!isEventHandler(eventName)) continue;
      
      parts = eventName.split('/');
      if (parts.length === 2) {
        element = this[parts.first()] || this.element;
      } else {
        element = this.element;
      }
      name = parts.last();
      
      handler = this._observers[name] = this[eventName].bind(this);      
      element.observe(name.substring(2), handler);
    }
  },
  
  /**
   *  S2.UI.Behavior#destroy() -> undefined
   *  
   *  Called when the behavior is removed from the element.
  **/
  destroy: function() {
    var element = this.options.proxy || this.element;
    var handler;
    for (var eventName in this._observers) {
      handler = this._observers[eventName];
      element.stopObserving(eventName.substring(2), handler);
    }
  }
});


Object.extend(S2.UI, {
  /**
   *  S2.UI.addBehavior(element, behaviorClass[, options]) -> undefined
   *  - element (Element | Array): One or more elements on which to apply
   *    the behavior.
   *  - behaviorClass (Class | Array): One or more subclasses of
   *    `UI.Behavior`. (Not instances!)
   *  
   *  Add a behavior.
  **/
  addBehavior: function(element, behaviorClass, options) {
    var self = arguments.callee;
    if (Object.isArray(element)) {
      element.each( function(el) { self(el, behaviorClass, options); });
      return;
    }
    
    if (Object.isArray(behaviorClass)) {
      behaviorClass.each( function(klass) { self(element, klass, options ); });
      return;
    }
    
    var instance = new behaviorClass(element, options || {});
    var behaviors = $(element).retrieve('ui.behaviors', []);
    behaviors.push(instance);
  },
  
  /**
   *  S2.UI.removeBehavior(element, behaviorClass) -> undefined
   *  - element (Element | Array): One or more elements on which to remove
   *    the behavior.
   *  - behaviorClass (Class | Array): One or more subclasses of
   *    `UI.Behavior`. (Not instances!)
   *  
   *  Remove a behavior.
  **/
  removeBehavior: function(element, behaviorClass) {
    var self = arguments.callee;
    if (Object.isArray(element)) {
      element.each( function(el) { self(el, behaviorClass); });
      return;
    }
    
    if (Object.isArray(behaviorClass)) {
      behaviorClass.each( function(klass) { self(element, klass); });
      return;
    }
    
    var behaviors = $(element).retrieve('ui.behaviors', []);
    var shouldBeRemoved = [];
    for (var i = 0, behavior; behavior = behaviors[i]; i++) {
      if (!behavior instanceof behaviorClass) continue;
      behavior.destroy();
      shouldBeRemoved.push(behavior);
    }
    $(element).store('ui.behaviors', behaviors.without(shouldBeRemoved));
  },
  
  
  /**
   *  S2.UI.getBehavior(element, behaviorClass) -> S2.UI.Behavior
  **/
  getBehavior: function(element, behaviorClass) {
    element = $(element);
    
    var behaviors = element.retrieve('ui.behaviors', []);
    for (var i = 0, l = behaviors.length, b; i < l; i++) {
      b = behaviors[i];
      if (b.constructor === behaviorClass) return b;
    }
    
    return null;
  }
});

//= require "behaviors/drag"
//= require "behaviors/focus"
//= require "behaviors/hover"
//= require "behaviors/resize"
//= require "behaviors/down"


