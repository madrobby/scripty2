
(function(UI) {  
  /** section: scripty2 ui
   *  class S2.UI.Button < S2.UI.Base
   *  
   *  Applies button-like behavior to an element.
  **/
  UI.Button = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Button",

    /**
     *  new S2.UI.Button(element, options)
    **/
    initialize: function(element, options) {
      this.element = $(element);

      var name = this.element.nodeName.toUpperCase(), type;
      
      // Assign a type to the button.
      if (name === 'INPUT') {
        type = this.element.type;
        if (type === 'checkbox' || type === 'radio') {
          this.type = this.element.type;
        } else {
          this.type = 'input';
        }
      } else {
        this.type = 'button';
      }
      
      var opt = this.setOptions(options);

      // For checkboxes and radio buttons, the label acts as the visual
      // representation of the control, and receives all interactions.
      if (this._isCheckboxOrRadio()) {
        this._handleFormWidget();  
      } else {
        this._makeButtonElement(this.element);
      }
      
      this.element.store('ui.button', this);
      if (this._buttonElement !== this.element) {
        this._buttonElement.store('ui.button', this);
      }

      this.enabled = true;
      var enabled = (this._buttonElement.disabled === true) || 
       !this._buttonElement.hasClassName('ui-state-disabled');

      this.setEnabled(enabled);
      
      this.observers = {
        click:   this._click.bind(this),
        keydown: this._keydown.bind(this)
      };
      this.addObservers();
    },
    
    addObservers: function() {
      this.observe('click', this.observers.click);
      this.observe('keydown', this.observers.keydown);
    },
    
    removeObservers: function() {
      this.stopObserving('click', this.observers.click);      
      this.stopObserving('keydown', this.observers.keydown);
    },
    
    isActive: function() {
      if (!this._isToggleButton()) return false;
      return this.hasClassName('ui-state-active');
    },
    
    _setActive: function(bool) {      
      this[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
    },
    
    toggle: function(bool) {
      if (!this._isToggleButton()) return;
      
      var isActive = this.isActive();
      if (Object.isUndefined(bool)) bool = !isActive;
      
      var willChange = (bool !== isActive);
      if (willChange) {
        var result = this.toElement().fire('ui:button:toggle');
        if (result.stopped) return;
      }
      this._buttonElement[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
    },
    
    _click: function(event) {
      this.toggle();
    },
    
    _keydown: function(event) {
      var code = event.keyCode;
      if (code !== Event.KEY_SPACE && code !== Event.KEY_RETURN)
        return;
        
      this.toggle();
      this.element.checked = this.isActive();
    },
    
    _isCheckboxOrRadio: function() {
      return this.type === 'checkbox' || this.type === 'radio';
    },
    
    _isToggleButton: function() {
      return this._isCheckboxOrRadio() || this.options.toggle;
    },
    
    _makeButtonElement: function(element) {
      this._buttonElement = element;

      var opt = this.options;
      UI.addClassNames(element,
       'ui-button ui-widget ui-state-default ui-corner-all');

      var B = UI.Behavior, behaviors = [B.Hover, B.Focus, B.Down];
      UI.addBehavior(element, behaviors);
 
      if (opt.primary) {
        element.addClassName('ui-priority-primary');
      }
 
      if (opt.label === null) {
        opt.label = element.innerHTML || element.value;
      }
      
      // ARIA.
      element.writeAttribute('role', 'button');
    },
    
    _handleFormWidget: function() {
      var opt = this.options;
      // First, find the label.
      var id = this.element.id, label;
      if (id) {
        label = $$('label[for="' + id + '"]')[0];
      }
      if (!label) {
        // The form widget might be wrapped in an implicit label.
        label = this.element.up('label');
      }
      
      if (!label) {
        opt.label = null;
        return;
      }
      
      this.element.addClassName('ui-helper-hidden-accessible');      
      this._makeButtonElement(label);
      UI.makeFocusable(label, true);
      this.label = label;
    },
    
    /**
     *  S2.UI.Button#setEnabled(isEnabled) -> this
     *  - isEnabled (Boolean): Whether the button should be enabled.
    **/
    setEnabled: function(isEnabled) {
      var element = this._buttonElement;
      if (this.enabled === isEnabled) return;
      this.enabled = isEnabled;
      if (isEnabled) {
        element.removeClassName('ui-state-disabled');
      } else {
        element.addClassName('ui-state-disabled');
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
      return this._buttonElement;
    },

    inspect: function() {
      return this.toElement().inspect();
    }
  });
  
  Object.extend(UI.Button, {
    DEFAULT_OPTIONS: {
      primary: false,
      label:   null,
      toggle:  false
    }
  });
  
})(S2.UI);