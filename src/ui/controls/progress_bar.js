(function(UI) {
  /** section: scripty2 ui
   *  class S2.UI.ProgressBar < S2.UI.Base
   *  
   *  A progress bar.
  **/
  UI.ProgressBar = Class.create(UI.Base, {
    NAME: "S2.UI.ProgressBar",

    /**
     *  new S2.UI.ProgressBar(element, options)
    **/
    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-progressbar ui-widget ' +
       'ui-widget-content ui-corner-all');

      // ARIA.
      this.element.writeAttribute({
        'role': 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': 0
      });

      this.valueElement = new Element('div', {
        'class': 'ui-progressbar-value ui-widget-header ui-corner-left'
      });

      // Set the value before appending the element in order
      // to avoid a flicker.
      this.value = opt.value.initial;
      this._refreshValue();

      this.element.insert(this.valueElement);
      this.element.store(this.NAME, this);
    },

    destroy: function() {
      UI.removeClassNames(this.element, 'ui-progressbar ui-widget ' +
       'ui-widget-content ui-corner-all');
      UI.removeAttributes(this.element, 'role aria-valuemin aria-valuemax ' +
       'aria-valuenow');
      this.element.getData().unset(this.NAME);
    },

    /**
     *  S2.UI.ProgressBar#getValue() -> Number
    **/
    getValue: function() {
      var value = this.value, v = this.options.value;
      if (value < v.min) value = v.min;
      if (value > v.max) value = v.max;
      return value;
    },

    /**
     *  S2.UI.ProgressBar#setValue() -> this
    **/
    setValue: function(value) {
      this._oldValue = this.getValue();
      this.value = value;
      this._refreshValue();
      return this;
    },

    /** 
     *  S2.UI.ProgressBar#undo() -> this
     *  
     *  Reverts the effect of the previous call to
     *  [[S2.UI.ProgressBar#setValue]].
    **/
    undo: function() {
      this.undoing = true;
      this.setValue(this._oldValue);
      this.undoing = false;
      return this;
    },

    _refreshValue: function() {
      var value = this.getValue();
      if (!this.undoing) {
        // If the event is stopped, we undo the change.
        var result = this.element.fire('ui:progressbar:value:changed', {
          progressBar: this,
          value: value
        });
        if (result.stopped) {
          this.undo();
          return;
        }
      }
      if (value === this.options.value.max) {
        this.valueElement.addClassName('ui-corner-right');
      } else {
        this.valueElement.removeClassName('ui-corner-right');
      }
      
      
      var width    = window.parseInt(this.element.getStyle('width'), 10);      
      var newWidth = (width * value) / 100;
      var css      = "width: #{0}px".interpolate([newWidth]);
      
      UI.makeVisible(this.valueElement, (value > this.options.value.min));
      this.valueElement.morph(css, { duration: 0.7, transition: 'linear' });
      this.element.writeAttribute('aria-valuenow', value);
    }
  });

  Object.extend(UI.ProgressBar, {
    DEFAULT_OPTIONS: {
      value: { min: 0, max: 100, initial: 0 }
    }
  });
  
})(S2.UI);