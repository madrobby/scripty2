(function(UI) {
  
  /** section: scripty2 ui
   *  class S2.UI.Base
   *  includes S2.UI.Mixin.Configurable
   *  
   *  A base class for all UI widgets.
  **/
  UI.Base = Class.create(UI.Mixin.Configurable, {
    NAME: "S2.UI.Base",
    
    initialize:      Function.ABSTRACT,
    
    /**
     *  S2.UI.Base#addObservers() -> undefined
    **/
    addObservers:    Function.ABSTRACT,

    /**
     *  S2.UI.Base#removeObservers() -> undefined
    **/
    removeObservers: function() {
      if (this.__observers) {
        this.__observers.invoke('stop');
        this.__observers = null;
      }
    },
    
    /**
     *  S2.UI.Base#destroy() -> undefined
    **/
    destroy: function() {
      this.removeObservers();
    },
    
    /**
     *  S2.UI.Base#toElement() -> Element | null
     *  
     *  Returns the DOM element corresponding to this control.
     *  
     *  By default, this returns the instance's `element` property, but
     *  widgets can override this behavior.
    **/
    toElement: function() {
      return this.element || null;
    },
    
    /**
     *  S2.UI.Base#inspect() -> String
     *  
     *  Returns a debug-friendly string representation of the widget.
    **/
    inspect: function() {
      return "#<#{NAME}>".interpolate(this);
    }
  });
  
})(S2.UI);