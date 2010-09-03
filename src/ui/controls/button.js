
(function(UI) {  
  /** section: scripty2 ui
   *  class S2.UI.Button < S2.UI.Base
   *  includes S2.UI.Mixin.Element
   *  
   *  Applies button-like behavior to an element.
  **/
  UI.Button = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Button",

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

      var disabled = (this.element.disabled === true)
       this.element.hasClassName('ui-state-disabled');

      this.setEnabled(!disabled);
      
      this.observers = {
        click: this._click.bind(this),
        keyup: this._keyup.bind(this)
      };
      this.addObservers();
    },
    
    addObservers: function() {
      this.observe('click', this.observers.click);
      this.observe('keyup', this.observers.keyup);
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
    
    /**
     *  S2.UI.Button#toggle([bool]) -> S2.UI.Button
     *  - bool (Boolean): Whether the button should be active or inactive. If
     *    omitted, defaults to the _opposite_ of the button's current state.
     *  
     *  Toggles the button between active and inactive. Returns the instance.
     *  
     *  If the button isn't a "toggle" button, the instance will immediately
     *  return itself.
    **/
    toggle: function(bool) {
      if (!this._isToggleButton()) return this;
      
      var isActive = this.isActive();
      if (Object.isUndefined(bool)) bool = !isActive;
      
      var willChange = (bool !== isActive);      
      if (willChange) {
        var result = this.toElement().fire('ui:button:toggle');
        if (result.stopped) return;
      }
      this._buttonElement[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
      
      return this;
    },
    
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
        this.element.checked = isActive;
      }).bind(this).defer();
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
 
      if (opt.text === null) {
        opt.text = element.innerHTML || element.value;
      }
      
      this._interpretContent(element);
      
      // ARIA.
      element.writeAttribute('role', 'button');
    },
    
    _makeIconElement: function(name, type) {
      var classNames = 'ui-button-icon-' + type + ' ui-icon ' + name;
      return new Element('span', { 'class': classNames });
    },
    
    // Handles assignment of icons, wrapping text in a SPAN, and other stuff
    // for buttons that can have HTML contents (i.e., everything but INPUTs).
    _interpretContent: function(element) {
      if (!this._isContainer()) return;

      var opt = this.options;
      var buttonClassName, primaryIcon, secondaryIcon;
      var hasIcon     = !!opt.icons.primary || !!opt.icons.secondary;
      var hasTwoIcons = !!opt.icons.primary && !!opt.icons.secondary;

      if (opt.icons.primary) {
        primaryIcon = this._makeIconElement(opt.icons.primary, 'primary');
      }
      
      if (opt.icons.secondary) {
        secondaryIcon = this._makeIconElement(opt.icons.secondary, 'secondary');
      }
      
      if (hasIcon) {
        if (this._hasText()) {
          buttonClassName = hasTwoIcons ? 'ui-button-text-icons' :
           'ui-button-text-icon';
        } else {
          buttonClassName = hasTwoIcons ? 'ui-button-icons-only' :
           'ui-button-icon-only';
        }
      } else {
        buttonClassName = 'ui-button-text-only';
      }
      
      this._wrapContentsInTextSpan(element);
      element.addClassName(buttonClassName);

      if (primaryIcon) {
        element.insert({ top: primaryIcon });
      }
      
      if (secondaryIcon) {
        element.insert({ bottom: secondaryIcon });
      }      
    },
    
    _wrapContentsInTextSpan: function(element) {
      var text = new Element('span', { 'class': 'ui-button-text' });      
      for (var i = 0, node; node = element.childNodes[i]; i++) {
        text.appendChild(node);
      }
      element.appendChild(text);      
    },
    
    _hasText: function() {
      return !!this.options.text;
    },
    
    _isContainer: function() {
      var element = this.toElement(), tag = element.nodeName.toUpperCase();
      return (tag !== 'INPUT');
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
        opt.text = null;
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
      text:    true,
      toggle:  false,
      icons: {
        primary:   null,
        secondary: null
      }
    }
  });
  
})(S2.UI);