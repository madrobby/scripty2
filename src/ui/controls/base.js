(function(UI) {
  
  /** section: scripty2 ui
   *  class S2.UI.Base
   *  includes S2.UI.Mixin.Configurable
  **/
  UI.Base = Class.create(UI.Mixin.Configurable, {
    NAME: "S2.UI.Base",
    
    /**
     *  S2.UI.Base#addObservers() -> undefined
    **/
    addObservers:    Function.ABSTRACT,    

    /**
     *  S2.UI.Base#removeObservers() -> undefined
    **/
    removeObservers: Function.ABSTRACT,
    
    /**
     *  S2.UI.Base#destroy() -> undefined
    **/
    destroy: function() {
      this.removeObservers();
    },
    
    /**
     *  S2.UI.Base#toElement() -> Element
     *  
     *  Returns the DOM element corresponding to this control.
    **/
    toElement: function() {
      return this.element;
    },
    
    /**
     *  S2.UI.Base#inspect() -> String
    **/
    inspect: function() {
      return "#<#{NAME}>".interpolate(this);
    }
  });
  
})(S2.UI);