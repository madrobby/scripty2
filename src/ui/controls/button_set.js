(function(UI) {
  
  UI.ButtonSet = Class.create(UI.Base, {
    NAME: "S2.UI.ButtonSet",
    
    initialize: function(element, options) {
      this.element = $(element);
      this.element.store('ui.buttonset', this);
      var opt = this.setOptions(options);
      
      this.element.addClassName('ui-buttonset');
      this.refresh();
      
      this.observers = {
        toggle: this._toggle.bind(this)
      };
      this.addObservers();
    },
    
    addObservers: function() {
      this.element.observe('ui:button:toggle', this.observers.toggle);
    },
    
    removeObservers: function() {
      this.element.stopObserving('ui:button:toggle', this.observers.toggle);
    },
    
    destroy: function() {
      this.removeObservers();
      this.element.removeClassName('ui-buttonset');
      UI.removeClassNames(this.buttons, 'ui-corner-left ui-corner-right');
      
      this.element.getStorage().unset('ui.buttonset');
    },
    
    _destroyButton: function(el) {
      var instance = el.retrieve('ui.button');
      if (instance) instance.destroy();
    },
    
    _toggle: function(event) {
      var element = event.element(), instance = element.retrieve('ui.button');
      if (!instance || instance.type !== 'radio') return;
      
      // If this is a set of radio buttons, enforce these rules:
      // * Can't toggle a button off by clicking on it while it's active.
      // * Only one button can be toggled on at any given time.
      if (instance.isActive()) {
        event.stop();
        return;
      }
      
      // If we get this far, it means the button that has been clicked on is
      // non-active and will become active when we return from this handler.
      // So we ensure all other buttons in the set are inactive. The button's
      // own handler takes care of the rest.
      this.instances.each( function(b) {
        b._setActive(false);
      });
    },
    
    refresh: function() {
      // Ensure there is no space between adjacent buttons.
      this.element.cleanWhitespace();
      
      this.buttons = [];
      
      this.element.descendants().each( function(el) {
        var isButton = false;
        if ($w('SELECT BUTTON A').include(el.nodeName.toUpperCase())) 
          isButton = true;
        if (el.match('input') && el.type !== 'hidden') isButton = true;
        if (el.hasClassName('ui-button')) isButton = true;
        
        if (isButton) this.buttons.push(el);
      }, this);
      
      this.instances = this.buttons.map( function(el) {
        var instance = el.retrieve('ui.button');
        if (!instance) instance = new UI.Button(el);
        return instance;
      });
      
      this.instances.each( function(b) {
        UI.removeClassNames(b.toElement(),
         'ui-corner-all ui-corner-left ui-corner-right');
      });
      
      if (this.instances.length > 0) {
        this.instances.first().toElement().addClassName('ui-corner-left');
        this.instances.last().toElement().addClassName('ui-corner-right');
      }      
    }
  });
  
})(S2.UI);