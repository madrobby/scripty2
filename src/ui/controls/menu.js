
(function(UI) {
  /** section: scripty2 ui
   *  class S2.UI.Menu < S2.UI.Base
   *  includes S2.UI.Mixin.Shim, S2.UI.Mixin.Element
  **/
  UI.Menu = Class.create(UI.Base, UI.Mixin.Shim, UI.Mixin.Element, {
    NAME: "S2.UI.Menu",

    /**
     *  new S2.UI.Menu([element][, options])
    **/
    initialize: function(element, options) {
      this.element = $(element);
      if (!this.element) {
        var options = element;
        this.element = new Element('ul');
      }
      
      this.activeId = this.element.identify() + '_active';
      var opt = this.setOptions();
      
      UI.addClassNames(this.element, 'ui-helper-hidden ui-widget ' +
       'ui-widget-content ui-menu ui-corner-' + opt.corner);
       
      this.choices = this.element.select('li');

      // -1 means no items are highlighted.
      this._highlightedIndex = -1;
      
      // ARIA.
      this.element.writeAttribute({
        'role': 'menu',
        'aria-activedescendant': this.activeId
      });
      
      this.choices.invoke('writeAttribute', 'role', 'menuitem');
      
      this.observers = {
        mouseover: this._mouseover.bind(this),
        click: this._click.bind(this)
      };      
      this.addObservers();
      
      // We set this flag to true right before we show the menu for the
      // first time. Needed because the IFRAME shim needs to be handled
      // _after_ insertion into the DOM, but _before_ initial display.
      this._shown = false;
      
      this.createShim();
      
    },
    
    /**
     *  S2.UI.Menu#addObservers() -> undefined
    **/
    addObservers: function() {
      this.observe('mouseover', this.observers.mouseover);
      this.observe('mousedown', this.observers.click);
    },
    
    /**
     *  S2.UI.Menu#removeObservers() -> undefined
    **/
    removeObservers: function() {
      this.stopObserving('mouseover', this.observers.mouseover);
      this.stopObserving('mousedown', this.observers.click);
    },
    
    /**
     *  S2.UI.Menu#clear() -> this
     *  
     *  Empties the menu of choices.
    **/
    clear: function() {
      this.element.select('li').invoke('remove');
      this.choices = [];
      return this;
    },
    
    /**
     *  S2.UI.Menu#addChoice(choice) -> Element
     *  - choice (Element | String): Content of the choice. If a string,
     *    will create a list item and set the string as its `innerHTML`.
     *    Can also be an `Element`; if a list item, will use as the choice.
     *    Otherwise, will surround the node with a list item and use that
     *    as the choice.
     *  
     *  Add a choice to the menu. Returns the added element.
    **/
    addChoice: function(choice) {
      var li;
      if (Object.isElement(choice)) {
        if (choice.tagName.toUpperCase() === 'LI') {
          li = choice;
        } else {
          li = new Element('li');
          li.insert(choice);
        }
      } else {
        li = new Element('li');
        li.update(choice);
      }
      
      li.addClassName('ui-menu-item');
      li.writeAttribute('role', 'menuitem');
      
      this.element.insert(li);
      this.choices = this.element.select('li');
      
      return li;
    },
    
    _mouseover: function(event) {
      var li = event.findElement('li');
      if (!li) return;
      
      this.highlightChoice(li);
    },
    
    _click: function(event) {
      var li = event.findElement('li');
      if (!li) return;
      
      this.selectChoice(li);
    },
    
    /**
     *  S2.UI.moveHighlight(delta) -> this
     *  - delta (Number): Number of "slots" to move the highlight. Positive
     *    numbers go down; negative numbers go up.
    **/
    moveHighlight: function(delta) {
      this._highlightedIndex = (this._highlightedIndex + delta).constrain(
       -1, this.choices.length - 1);
      
      this.highlightChoice();
      return this;
    },
    
    /**
     *  S2.UI.Menu#highlightChoice([element]) -> this
    **/
    highlightChoice: function(element) {
      var choices = this.choices, index;
      
      if (Object.isElement(element)) {
        index = choices.indexOf(element);
      } else if (Object.isNumber(element)) {
        index = element;
      } else {
        index = this._highlightedIndex;
      }
      
      UI.removeClassNames(this.choices, 'ui-state-active');
      if (index === -1) return;
      this.choices[index].addClassName('ui-state-active');
      this._highlightedIndex = index;
      
      // ARIA: Move the ID of the active item.
      var active = this.element.down('#' + this.activeId);
      if (active) active.writeAttribute('id', '');
      this.choices[index].writeAttribute('id', this.activeId);
    },
    
    /**
     *  S2.UI.selectChoice([element]) -> this
     *  fires ui:menu:selected
     *  - element (Element | Number): The choice to select — either its
     *    DOM node or its index. If omitted, will select the highlighted
     *    choice.
    **/
    selectChoice: function(element) {
      var element;
      if (Object.isNumber(element)) {
        element = this.choices[element];
      } else if (!element) {
        element = this.choices[this._highlightedIndex];
      }
      
      var result = this.element.fire('ui:menu:selected', {
        instance: this,
        element: element
      });
      
      if (!result.stopped) {
        this.close();
      }
      
      return this;      
    },
    
    /**
     *  S2.UI.Menu#open() -> this
     *  fires ui:menu:before:open, ui:menu:after:open
    **/
    open: function() {
      // if (!this._shown) {
      //   // IFRAME shim for IE6.
      //   UI.forceRedraw(this.element);
      //   this._shown = true;
      // }
      
      var result = this.element.fire('ui:menu:before:open', { instance: this });
      // TODO: Figure out why IE doesn't like this.
      // if (!result.stopped) {
        this.element.removeClassName('ui-helper-hidden');
        this._highlightedIndex = -1;
      // }
      
      if (Prototype.Browser.IE) {
        this.adjustShim();
      }
      
      if (this.options.closeOnOutsideClick) {
        this._outsideClickObserver = $(this.element.ownerDocument).on('click', function(event) {
          var element = event.element();
          if (element !== this.element && !element.descendantOf(this.element)) {
            this.close();
          }
        }.bind(this));
      }
      
      this.element.fire('ui:menu:after:open', { instance: this });
    },
    
    /**
     *  S2.UI.Menu#close() -> this
     *  fires ui:menu:before:close, ui:menu:after:close
    **/
    close: function() {
      var result = this.element.fire('ui:menu:before:close', { instance: this });
      // TODO: Figure out why IE doesn't like this.
      // if (!result.stopped) {
        this.element.addClassName('ui-helper-hidden');      
      // }
      //return this;
      
      this.element.fire('ui:menu:after:close', { instance: this });
      
      if (this._outsideClickObserver) {
        this._outsideClickObserver.stop();
        this._outsideClickObserver = null;
      }
      
      return this;
    },
    
    /**
     *  S2.UI.Menu#isOpen() -> Boolean
    **/
    isOpen: function() {
      return !this.element.hasClassName('ui-helper-hidden');
    }
  });
  
  Object.extend(UI.Menu, {
    DEFAULT_OPTIONS: {
      corner: 'all',
      closeOnOutsideClick: true
    }
  });
  
})(S2.UI);