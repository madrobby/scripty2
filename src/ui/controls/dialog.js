(function(UI) {

  /** section: scripty2 ui
   *  class S2.UI.Dialog < S2.UI.Base
   *  includes S2.UI.Mixin.Element
   *
   *  A class for showing dialogs on screen.
   *
   *  <h4>Options</h4>
   *
   *  * `zIndex` (`Number`): The CSS `z-index` for the dialog. Default is
   *    `1000`.
   *  * `title` (`String`): The text to display in the dialog's title bar.
   *    Default is `"Dialog"`.
   *  * `content` (`String` | `Element`): The content to display as the body
   *    of the dialog. Strings can be plaintext or HTML; they'll be
   *    inserted as-is into the dialog. If `content` refers to an element
   *    on the page, that element will be detached from its initial
   *    location _when the dialog is instantiated_.
   *  * `submitForms` (`Boolean`): By default, a dialog will suppress the
   *    `onsubmit` event of any forms included in the dialog's content (in
   *    order to prevent navigation to a new page). Set this to `true` to
   *    override this behavior.
   *  * `closeOnEscape` (`Boolean`): Whether the dialog closes (with a
   *    "cancel" outcome) when the ESC key is pressed. Default is `true`.
   *  * `draggable` (`Boolean`): Whether the dialog should be draggable (with
   *    the dialog's title bar as the handle). Default is `true`.
   *  * `resizable` (`Boolean`): Whether the dialog should be resizable.
   *    Default is `false`.
   *  * `buttons` (`Array` | `Boolean`): A set of `Object`s that describe the
   *    buttons that should appear at the bottom of the dialog. Set to `false`
   *    to omit buttons.
   *  
   *  <h4>Events</h4>
   *  
   *  All events have a `dialog` property (e.g., `event.memo.dialog`) that
   *  holds the relevant instance of `S2.UI.Dialog`. Some events have further
   *  properties, as explained below.
   *  
   *  * `ui:dialog:before:open`: Fired when the dialog is told to open,
   *    but before it is displayed on screen. **Cancelable**. If cancelled,
   *    will suppress the display of the dialog.
   *  * `ui:dialog:after:open`: Fired just after the dialog is displayed on
   *    screen. Cannot be cancelled.
   *  * `ui:dialog:before:close`: Fired when the dialog is told to close
   *    (whether successfully or unsuccessfully), but before it has been
   *    hidden. **Cancelable**. If cancelled, will suppress the hiding of the
   *    dialog.
   *  * `ui:dialog:after:close`: Fired just after the dialog disappears from
   *    the screen. Cannot be cancelled. The `success` property is a boolean
   *    that tells whether the dialog was closed in success. The `form`
   *    property (present if the dialog's content contained a `FORM` element)
   *    holds an `Object` serialization of the form's content.
   *
  **/
  UI.Dialog = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Dialog",

    /**
     *  new S2.UI.Dialog(element, options)
     *  new S2.UI.Dialog(options)
     *  
     *  If `element` is given, that element will become the container for
     *  the dialog. Otherwise, an element will be created to serve as the
     *  container.
     *  
     *  Note that **the dialog is not displayed on screen when it is
     *  created**. You must explicitly call [[S2.UI.Dialog#open]] first.
    **/
    initialize: function(element, options) {
      if (!Object.isElement(element)) {
        options = element;
        element = null;
      } else {
        element = $(element);
      }

      var opt = this.setOptions(options);

      this.element = element || new Element('div');
      UI.addClassNames(this.element, 'ui-dialog ui-widget ' + 
       'ui-widget-content ui-corner-all');

      this.element.hide().setStyle({
        position: 'absolute',
        overflow: 'hidden',
        zIndex:   opt.zIndex,
        outline:  '0'
      });

      // ARIA.
      this.element.writeAttribute({
        tabIndex: '-1',
        role: 'dialog'
      });
      
      if (opt.content) {
        this.content = Object.isElement(opt.content) ? opt.content :
         new Element('div').update(opt.content);
      } else {
        this.content = new Element('div');
      }
      
      // Dialog content.
      UI.addClassNames(this.content, 'ui-dialog-content ui-widget-content');
      this.element.insert(this.content);

      // Dialog title bar.
      this.titleBar = this.options.titleBar || new Element('div');
      UI.addClassNames(this.titleBar, 'ui-dialog-titlebar ui-widget-header ' +
  		 'ui-corner-all ui-helper-clearfix');
  		this.element.insert({ top: this.titleBar });

  	  // Close button.
  	  this.closeButton = new Element('a', { 'href': '#' });
  	  UI.addClassNames(this.closeButton, 'ui-dialog-titlebar-close ' +
  	   'ui-corner-all');
  	  new UI.Button(this.closeButton, {
  	    text: false,
  	    icons: { primary: 'ui-icon-closethick' }
  	  });
  	  this.closeButton.observe('mousedown', Event.stop);
  	  this.closeButton.observe('click', function(event) {
  	    event.stop();
  	    this.close(false);
  	  }.bind(this));

  	  this.titleBar.insert(this.closeButton);

  	  // SPAN for close button.
      // this.closeText = new Element('span');
      // UI.addClassNames(this.closeText, 'ui-icon ui-icon-closethick');
      // 
      // this.closeButton.insert(this.closeText);

  	  // Text for title bar.
  	  this.titleText = new Element('span', { 'class': 'ui-dialog-title' });
  	  this.titleText.update(this.options.title).identify();
  	  // This is the label for ARIA.	  
  	  this.element.writeAttribute('aria-labelledby',
  	   this.titleText.readAttribute('id'));
  	  this.titleBar.insert({ top: this.titleText }) ;

      UI.disableTextSelection(this.element);

      if (this.options.draggable) {
        UI.addBehavior(this.element, UI.Behavior.Drag,
         { handle: this.titleBar });
      }

      // TODO: Add resizability.

      var buttons = this.options.buttons;

      if (buttons && buttons.length) {
        this._createButtons();
      }

      this.observers = {
        keypress: this.keypress.bind(this)
      };

    },
    
    toElement: function() {
      return this.element;
    },

    _createButtons: function() {
      var buttons = this.options.buttons;
      if (this.buttonPane) {
        this.buttonPane.remove();
      }

      this.buttonPane = new Element('div');
      UI.addClassNames(this.buttonPane,
       'ui-dialog-buttonpane ui-widget-content ui-helper-clearfix');

      buttons.each( function(button) {
        var element = new Element('button', { type: 'button' });
        UI.addClassNames(element, 'ui-state-default ui-corner-all');

        if (button.primary) {
          element.addClassName('ui-priority-primary');
        }

        if (button.secondary) {
          element.addClassName('ui-priority-secondary');
        }

        element.update(button.label);
        new UI.Button(element);
        element.observe('click', button.action.bind(this, this));

        this.buttonPane.insert(element);
      }, this);

      this.element.insert(this.buttonPane);
    },

    _position: function() {
      // Find the middle of the viewport.
      var vSize = document.viewport.getDimensions();
      var dialog = this.element, layout = dialog.getLayout();
      
      var position = {
        left: ((vSize.width  / 2) - (layout.get('width')  / 2)).round(),
        top:  ((vSize.height / 2) - (layout.get('height') / 2)).round()
      };

      var offsets = document.viewport.getScrollOffsets();

      position.left += offsets.left;
      position.top  += offsets.top;

      this.element.setStyle({
        left: position.left + 'px',
        top:  position.top  + 'px'
      });
    },

    /**
     *  S2.UI.Dialog#open() -> this
     *  
     *  Opens the dialog.
    **/
    open: function() {
      if (this._isOpen) return;

      // Fire an event to allow for suppression of the dialog.
      var result = this.element.fire("ui:dialog:before:open",
       { dialog: this });
      if (result.stopped) return;

      var opt = this.options;

      this.overlay = opt.modal ? new UI.Overlay() : null;
      $(document.body).insert(this.overlay);    
      $(document.body).insert(this);

      this.element.show();
      this._position();

      this.focusables = UI.findFocusables(this.element);

      var forms = this.content.select('form');
      if (this.content.match('form')) {
        forms.push(this.content);
      }
      
      // Disable form submission.
      if (!opt.submitForms) {
        forms.invoke('observe', 'submit', Event.stop);
      }

      // Figure out what to focus first, excluding the close button.
      var f = this.focusables.without(this.closeButton);
      var focus = opt.focus, foundFocusable = false;
      if (focus === 'auto' && forms.length > 0) {
        // 'auto' means we focus the first form element (if there is a form).
        // Otherwise we let it fall through the conditional and focus either
        // the primary button _or_ the first focusable element in the dialog.
        Form.focusFirstElement(forms.first());
        foundFocusable = true;
      } else if (focus === 'first') {
        // Focus the first element.
        f.first().focus();
        foundFocusable = true;
      } else if (focus === 'last') {
        // Focus the last element.
        f.last().focus();
        foundFocusable = true;
      } else if (Object.isElement(focus)) {
        // Focus the passed-in element.
        focus.focus();
        foundFocusable = true;
      } else {
        // Focus the primary action button, if there is one.
        if (this.buttonPane) {
          var primary = this.buttonPane.down('.ui-priority-primary');
          if (primary) {
            primary.focus();
            foundFocusable = true;
          }
        }
      }

      // If we didn't find anything, just focus the first focusable element.
      if (!foundFocusable && f.length > 0) {
        f.first().focus();
      }

      Event.observe(window, 'keydown', this.observers.keypress);
      this._isOpen = true;

      this.element.fire("ui:dialog:after:open", { dialog: this });
      return this;
    },

    /**
     *  S2.UI.Dialog#close(success) -> this
     *  - success (Boolean): Whether the dialog should be closed "successfully"
     *    (i.e., _OK_) or "unsuccessfully" (i.e., _Cancel_).
     *  
     *  Closes the dialog.
    **/
    close: function(success) {
      success = !!success; // Coerce to a boolean.
      var result = this.element.fire("ui:dialog:before:close",
       { dialog: this });
      if (result.stopped) return;

      if (this.overlay) {
        this.overlay.destroy();
      }

      this.element.hide();
      this._isOpen = false;
      Event.stopObserving(window, 'keydown', this.observers.keypress);

      var memo = { dialog: this, success: success };

      // If the content area had a form, we'll get the values in object form and
      // add them to the custom event metadata.
      var form = this.content.match('form') ? this.content : this.content.down('form');      
      if (form) {
        Object.extend(memo, { form: form.serialize({ hash: true }) });
      }

      this.element.fire("ui:dialog:after:close", memo);
      UI.enableTextSelection(this.element, true);
      return this;
    },

    keypress: function(event) {
      if (UI.modifierUsed(event)) return;

      var f = this.focusables, opt = this.options;
      if (event.keyCode === Event.KEY_ESC) {
        if (opt.closeOnEscape) this.close(false);
        return;
      }

      if (event.keyCode === Event.KEY_RETURN) {
        this.close(true);
        return;
      }

      if (event.keyCode === Event.KEY_TAB) {
        if (!this.options.modal) return;
        if (!f) return;
        // Don't allow the user to tab to an element below the overlay.
        var next, current = event.findElement();
        var index = f.indexOf(current);
        // If none of the focusables are focused (WTF?), just focus the first one.
        if (index === -1) {
          next = f.first();
        } else {
          if (event.shiftKey) {
            // Backward. Find the previous focusable.
            next = index === 0 ? f.last() : f[index - 1];
          } else {
            // Forward. Find the next focusable.
            next = (index === (f.length - 1)) ? f.first() : f[index + 1];
          }
        }

        if (next) {
          event.stop();
          (function() { next.focus(); }).defer();
        }
      }
    }
  });
  
  Object.extend(UI.Dialog, {
    DEFAULT_OPTIONS: {
      zIndex: 1000,

      title: "Dialog",
      
      content: null,
      modal:   true,
      focus:   'auto',

      submitForms: false,

      closeOnEscape: true,

      draggable: true,
      resizable: false,

      buttons: [
        {
          label: "OK",
          primary: true,
          action: function(instance) {
            instance.close(true);
          }
        }
      ]
    }
  });
  
})(S2.UI);
