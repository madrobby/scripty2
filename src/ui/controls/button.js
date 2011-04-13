

(function(UI) {

  /** section: scripty2 ui
   *  class S2.UI.Button < S2.UI.Base
   *  includes S2.UI.Mixin.Element
   *  
   *  Applies button-like behavior to an element.
  **/
  UI.Button = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Button",
    
    /// PUBLIC
    
    /**
     *  new S2.UI.Button(element[, options])
     *  - element (Element): The element to serve as the button's base. Can
     *    be a typical `input` (with `type` set to `submit` or `button`); or
     *    a `button` or `a` element. The latter two options allow for more
     *    customization of the button's content.
     *  - options (Object): A set of options for customizing the button.
     *  
     *  Creates an `S2.UI.Button`.
    **/
    initialize: function(element, options) {
      this.element = $(element);
      this.type = this._getType();      
      this.setOptions(options);
      
      this.element.store('ui.button', this);
      this.toElement().store('ui.button', this);
      
      this.observers = {
        click:   this._click.bind(this),
        keyup:   this._keyup.bind(this)
      };
      
      this.addObservers();
      
      this._initialized = true;
    },
    
    setOptions: function($super, options) {
      var opt = $super(options);
      this._applyOptions();
      return opt;
    },
    
    addObservers: function() {
      for (var eventName in this.observers)
        this.observe(eventName, this.observers[eventName]);
    },
    
    removeObservers: function() {
      for (var eventName in this.observers)
        this.stopObserving(eventName, this.observers[eventName]);
    },
    
    /**
     *  S2.UI.Button#isActive() -> Boolean
     *  
     *  Reports whether a toggle button is active or inactive. Always returns
     *  `false` if the button is not a toggle button.
    **/
    isActive: function() {
      if (!this._isToggleButton()) return false;
      return this.hasClassName('ui-state-active');
    },
    
    /**
     *  S2.UI.Button#toggle([bool]) -> S2.UI.Button
     *  - bool (Boolean): Whether the button should be active or inactive. If
     *    omitted, defaults to the _opposite_ of the button's current state.
     *  
     *  Toggles the button between active and inactive. Returns the instance.
     *  
     *  Takes no action if the button is not a toggle button.
    **/
    toggle: function(bool) {
      if (!this._isToggleButton()) return this;
      
      var isActive = this.isActive();
      if (Object.isUndefined(bool)) bool = !isActive;
      
      if (bool !== isActive) {
        // We're about to flip this toggle to the opposite state.
        var result = this.fire('ui:button:toggle', { button: this });
        if (result.stopped) return this;
      }
      
      this[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
      return this;
    },
    
    /**
     *  S2.UI.Button#setEnabled(isEnabled) -> this
     *  - isEnabled (Boolean): Whether the button should be enabled.
     *  
     *  Sets the enabled/disabled state of the button. A disabled button
     *  won't respond to click, hover, or focus events.
    **/
    setEnabled: function(shouldBeEnabled) {
      var element = this.toElement();
      
      if (this.enabled === shouldBeEnabled) return;
      this.enabled = shouldBeEnabled;

      if (shouldBeEnabled) element.removeClassName('ui-state-disabled');
      else element.addClassName('ui-state-disabled');
      
      this.element.disabled = !shouldBeEnabled;
    },
    
    toElement: function() {
      return this._buttonElement || this.element;
    },
    
    
    /// PRIVATE
    
    _getType: function() {
      var name = this.element.nodeName.toUpperCase(), type;
      
      if (name === 'INPUT') {
        type = this.element.type;
        if (type === 'checkbox' || type === 'radio') {
          return type;
        } else if (type === 'button') {
          return 'input';
        }
      } else {
        return 'button';
      }
    },
    
    
    _hasText: function() {
      var text = this.options.text;
      return !!text && text !== '&nbsp;' && (/\S/).test(text);
    },
    
    // Can we put other elements inside this button?
    _isContainer: function() {
      return this.type !== 'input';
    },
    
    _isToggleButton: function() {
      return this.type === 'checkbox' || this.type === 'radio' ||
       this.options.toggle;
    },
    
    _applyOptions: function() {
      if (this.type === 'checkbox' || this.type === 'radio') {
        // To adapt checkboxes and radio buttons into standard buttons, we
        // hide the form control and instead repurpose the LABEL element
        // to act like a button.
        this._adaptFormWidget();
      } else {
        this._makeButtonElement(this.element);
      }
      
      this.enabled = true;
      var disabled = (this.element.disabled === true) ||
       this.element.hasClassName('ui-state-disabled');
       
      this.setEnabled(!disabled);      
    },
    
    _makeButtonElement: function(element) {
      var opt = this.options, B = UI.Behavior;
      this._buttonElement = element;
      
      UI.addClassNames(element, 'ui-button ui-widget ui-state-default ' +
       'ui-corner-all');
      UI.addBehavior(element, [B.Hover, B.Focus, B.Down]);
      
      if (opt.primary)
        element.addClassName('ui-priority-primary');
      
      if (opt.text === null || opt.text === true)
        opt.text = element.value || UI.getText(element);
      
      // ARIA.
      element.writeAttribute('role', 'button');
      
      if (this._isContainer()) {
        var buttonClassName, primaryIcon, secondaryIcon;
        var icons = opt.icons;
        
        var hasIcon     = !!icons.primary || !!icons.secondary;
        var hasTwoIcons = !!icons.primary && !!icons.secondary;
        var hasText     = this._hasText();
        
        if (icons.primary)
          primaryIcon = this._makeIconElement(icons.primary, 'primary');

        if (icons.secondary)
          secondaryIcon = this._makeIconElement(icons.secondary, 'secondary');
          
        if (hasIcon) {
          if (hasText) {
            buttonClassName = hasTwoIcons ? 'ui-button-text-icons' :
             'ui-button-text-icon';
          } else {
            buttonClassName = hasTwoIcons ? 'ui-button-icons-only' :
             'ui-button-icon-only';
          }
        } else {
          buttonClassName = 'ui-button-text-only';
        }
        
        element.update('');
        element.addClassName(buttonClassName);
        
        if (primaryIcon)   element.insert(primaryIcon);
        element.insert(this._makeTextElement(opt.text));
        if (secondaryIcon) element.insert(secondaryIcon);
      }
      
    },
    
    // Expects the name of the icon (e.g., 'ui-icon-dot') and the "type"
    // (primary or secondary).
    _makeIconElement: function(name, type) {
      var classNames = 'ui-button-icon-' + type + ' ui-icon ' + name;
      return new Element('span', { 'class': classNames });
    },
    
    _makeTextElement: function(text) {
      var span = new Element('span', { 'class': 'ui-button-text' });
      // Even an empty text element (e.g., for icon-only buttons) needs to
      // have at least one character of text to force proper alignment.
      // Be careful - UTF-8 character here!
      span.update(text || " ");
      return span;
    },
    
    _adaptFormWidget: function() {
      var opt = this.options;      
      var id = this.element.id, label;
      
      // Look for a label. 
      if (id) {
        label = $$('label[for="' + id + '"]')[0];
      }
      
      // If we can't find it by ID, it one of the form control's ancestors
      // might be an implicit label.
      if (!label) label = this.element.up('label');

      // If we can't find a label, it's an exceptional state; we can't
      // proceed with what the user has asked.
      if (!label) {
        throw "Can't find a LABEL element for this button.";
      }
      
      this.label = label;
      
      this.element.addClassName('ui-helper-hidden-accessible');
      this._makeButtonElement(label);
      UI.makeFocusable(label, true);
    },
    
    /// EVENT RESPONDERS
    
    _click: function(event) {
      this.toggle(!this.isActive());
      this.element.checked = this.isActive();
    },
    
    _keyup: function(event) {
      var code = event.keyCode;
      if (code !== Event.KEY_SPACE && code !== Event.KEY_RETURN)
        return;
      
      var isActive = this.isActive();
      (function() {
        if (isActive !== this.isActive()) return;
        this.toggle(isActive);
        this.element.checked = this.isActive();
      }).bind(this).defer();      
    }
  });
  
    
  Object.extend(UI.Button, {
    DEFAULT_OPTIONS: {
      primary: false,
      text:    true,
      toggle:  false,
      icons: {
        primary:   null,
        secondary: null
      }
    }
  });
  
})(S2.UI);