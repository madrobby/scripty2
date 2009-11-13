

(function(UI) {
  
  /** section: scripty2 UI
   *  class S2.UI.Autocompleter
   *  includes UI.Mixin.Configurable
  **/
  UI.Autocompleter = Class.create(UI.Mixin.Configurable, {
    /**
     *  new S2.UI.Autocompleter(element, options)
     *  
     *  Instantiates an autocompleter.
    **/
    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);
      
      UI.addClassNames(this.element, 'ui-widget ui-autocompleter');
      
      this.input = this.element.down('input[type="text"]');
      
      if (!this.input) {
        this.input = new Element('input', { type: 'text' });
        this.element.insert(this.input);
      }
      
      this.input.insert({ before: this.button });
      this.input.setAttribute('autocomplete', 'off');
      
      this.name = opt.parameterName || this.input.readAttribute('name');
      
      if (opt.choices) {
        this.choices = opt.choices.clone();
      }
      
      this.menu = new UI.Menu();
      this.element.insert(this.menu.element);
      
      this.observers = {
        blur: this._blur.bind(this),
        keyup: this._keyup.bind(this),
        keydown: this._keydown.bind(this),
        selected: this._selected.bind(this)
      };
      
      this.addObservers();
    },
    
    addObservers: function() {
      this.input.observe('blur',    this.observers.blur);
      this.input.observe('keyup',   this.observers.keyup);
      this.input.observe('keydown', this.observers.keydown);
      
      this.menu.element.observe('ui:menu:selected', 
       this.observers.selected);
    },
    
    _schedule: function() {
      this._unschedule();
      this._timeout = this._change.bind(this).delay(this.options.frequency);
    },
    
    _unschedule: function() {
      if (this._timeout) window.clearTimeout(this._timeout);
    },

    _keyup: function(event) {
      var value = this.input.getValue();
      
      if (value) {
        if (value.blank() || value.length < this.options.minCharacters) {
          // Empty values mean the menu should be hidden and all timers
          // should be unscheduled.
          this.menu.close();
          this._unschedule();
          return;
        }
        if (value !== this._value) {
          // Value has changed.
          this._schedule();          
        }
      } else {
        this.menu.close();
        this._unschedule();
      }
      
      this._value = value;
    },
    
    _keydown: function(event) {
      if (UI.modifierUsed(event)) return;
      if (!this.menu.isOpen()) return;
      
      var keyCode = event.keyCode || event.charCode;
      
      switch (event.keyCode) {
        case Event.KEY_UP:
          this.menu.moveHighlight(-1);
          event.stop();
          break;
        case Event.KEY_DOWN:
          this.menu.moveHighlight(1);
          event.stop();
          break;    
        case Event.KEY_TAB:
          this.menu.selectChoice();
          break;
        case Event.KEY_RETURN:
          this.menu.selectChoice();
          this.input.blur();
          event.stop();
          break;
        case Event.KEY_ESC:
          this.input.setValue('');
          this.input.blur();
          break;
      }
    },
     
    _change: function() {
      var value = this._value, choices = this._getChoices();
      var results = choices.inject([], function(memo, choice) {
        if (choice.toLowerCase().include(value.toLowerCase())) {
          memo.push(choice);
        }
        return memo;
      });
      
      this.results = results;
      
      this._updateMenu(results);
    },
    
    _getChoices: function() {
      return this.choices || [];
    },
    
    _updateMenu: function(results) {
      var opt = this.options;
      
      this.menu.clear();
      
      // Build a case-insensitive regexp for highlighting the substring match.
      var needle = new RegExp(RegExp.escape(this._value), 'i');
      for (var i = 0, result, li, text; result = results[i]; i++) {
        text = opt.highlightSubstring ? 
         result.replace(needle, "<b>$&</b>") :
         text;
         
        li = new Element('li').update(text);
        li.store('ui.autocompleter.value', result);
        this.menu.addChoice(li);
      }
      
      if (results.length === 0) {
        this.menu.close();
      } else {
        this.menu.open();
      }      
    },
    
    
    _moveMenuChoice: function(delta) {
      var choices = this.list.down('li');
      this._selectedIndex = (this._selectedIndex + delta).constrain(
       -1, this.results.length - 1);
       
      this._highlightMenuChoice();
    },
    
    _highlightMenuChoice: function(element) {
      var choices = this.list.select('li'), index;
      
      if (Object.isElement(element)) {
        index = choices.indexOf(element);
      } else if (Object.isNumber(element)) {
        index = element;
      } else {
        index = this._selectedIndex;
      }

      console.log("_highlightMenuChoice", index, element, choices);

      UI.removeClassNames(choices, 'ui-state-active');      
      if (index === -1) return;
      choices[index].addClassName('ui-state-active');
      
      this._selectedIndex = index;
    },
    
    _selected: function(event) {
      var memo = event.memo, li = memo.element;      
      var newValue = li.retrieve('ui.autocompleter.value');
      this.input.setValue(newValue);
      this.menu.close();
    },
    
    _blur: function(event) {
      this._unschedule();
      this.menu.close();
    }
  });
  
  Object.extend(UI.Autocompleter, {
    DEFAULT_OPTIONS: {
      tokens: [],
      frequency: 0.4,
      minCharacters: 1,
      
      highlightSubstring: true,
      
      onShow: Prototype.K,
      onHide: Prototype.K
    }
  });  
  
})(S2.UI);