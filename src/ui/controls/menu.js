
(function(UI) {
  /**
   *  class S2.UI.Menu
   *  includes UI.Mixin.Configurable
  **/
  UI.Menu = Class.create(UI.Mixin.Configurable, {
    /**
     *  new S2.UI.Menu([element], [options])
    **/
    initialize: function(element, options) {
      this.element = $(element);
      if (!this.element) {
        var options = element;
        this.element = new Element('ul', { 'class': 'ui-helper-hidden' });
        this.close();
      }
      
      this.activeId = this.element.identify() + '_active';
      var opt = this.setOptions();
      
      UI.addClassNames(this.element, 'ui-widget ui-widget-content ' +
       'ui-menu ui-corner-' + opt.corner);
       
      this.choices = this.element.select('li');

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
    },
    
    /**
     *  S2.UI.addObservers() -> undefined
    **/
    addObservers: function() {
      this.element.observe('mouseover', this.observers.mouseover);
      this.element.observe('mousedown', this.observers.click);
    },
    
    /**
     *  S2.UI.removeObservers() -> undefined
    **/
    removeObservers: function() {
      this.element.stopObserving('mouseover', this.observers.mouseover);
      this.element.stopObserving('mousedown', this.observers.click);
    },
    
    /**
     *  S2.UI.Menu#clear() -> this
     *  
     *  Empties the menu of choices.
    **/
    clear: function() {
      this.element.update();
      return this;
      this.choices = [];
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
     *  fires
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
      console.log("selectChoice", element);
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
     *  fires ui:menu:opened
    **/
    open: function() {
      var result = this.element.fire('ui:menu:opened', { instance: this });
      if (!result.stopped) {
        this.element.removeClassName('ui-helper-hidden');
        this._highlightedIndex = -1;
      }
      return this;
    },
    
    /**
     *  S2.UI.Menu#close() -> this
     *  fires ui:menu:closed
    **/
    close: function() {
      var result = this.element.fire('ui:menu:closed', { instance: this });
      if (!result.stopped) {
        this.element.addClassName('ui-helper-hidden');      
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
      corner: 'all'
    }
  });
  
})(S2.UI);