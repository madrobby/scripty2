
(function(UI) {  
  /** section: scripty2 UI
   *  class S2.UI.Button
   *  includes S2.UI.Mixin.Configurable
   *  
   *  Applies button-like behavior to an element.
  **/
  UI.Button = Class.create(UI.Mixin.Configurable, {
    /**
     *  new S2.UI.Button(element, options)
    **/
    initialize: function(element, options) {
      this.element = $(element);
      this.element.store('ui.button', this);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-state-default ui-corner-all');
      UI.addBehavior(this.element, [UI.Behavior.Hover, UI.Behavior.Focus,
       UI.Behavior.Down]);
       
      if (opt.primary) {
        this.element.addClassName('ui-priority-primary');
      }

      // ARIA
      this.element.writeAttribute('role', 'button');

      this.enabled = true;
      var enabled = (this.element.disabled === true) || 
       !this.element.hasClassName('ui-state-disabled');

      this.setEnabled(enabled);
    },
    
    /**
     *  S2.UI.Button#setEnabled(isEnabled) -> this
     *  - isEnabled (Boolean): Whether the button should be enabled.
    **/

    setEnabled: function(isEnabled) {
      if (this.enabled === isEnabled) return;
      this.enabled = isEnabled;
      if (isEnabled) {
        this.element.removeClassName('ui-state-disabled');
      } else {
        this.element.addClassName('ui-state-disabled');
      }
      this.element.disabled = !isEnabled;
    },

    /**
     *  S2.UI.Button#toElement() -> Element
     *  
     *  Returns the DOM element for the button. This allows button instances
     *  to be passed to certain Prototype methods that expect elements, like
     *  `Element#insert`.
    **/
    toElement: function() {
      return this.element;
    },

    /**
     *  S2.UI.toHTML() -> String
     *  
     *  Returns the HTML of the instance's element.
    **/
    toHTML: function() {
      return this.element.toHTML();
    },

    /**
     *  S2.UI.toString() -> String
     *  
     *  Returns the HTML of the instance's element.
    **/
    toString: function() {
      return this.element.toHTML();
    },

    inspect: function() {
      return this.element.inspect();
    }
  });
  
  Object.extend(UI.Button, {
    DEFAULT_OPTIONS: {
      primary: false
    }
  });
  
})(S2.UI);