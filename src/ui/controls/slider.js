

(function(UI) {
  /** section: scripty2 ui
   *  class S2.UI.Slider < S2.UI.Base
   *  
   *  A slider.
  **/
  UI.Slider = Class.create(UI.Base, {
    NAME: "S2.UI.Slider",

    /**
     *  new S2.UI.Slider(element, options)
     *  - element (Element): The element to act as the slider track.
     *  - options (Object): An object containing overrides for the default
     *    options.
    **/
    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);
    
      UI.addClassNames(this.element, 'ui-slider ui-widget ' +
       'ui-widget-content ui-corner-all');
      
      this.orientation = opt.orientation; 
    
      this.element.addClassName('ui-slider-' + this.orientation);
    
      this._computeTrackLength();

      var initialValues = opt.value.initial;
      if (!Object.isArray(initialValues)) {
        initialValues = [initialValues];
      } 
    
      this.values  = initialValues;
      this.handles = [];    
      this.values.each( function(value, index) {
        var handle = new Element('a', { href: '#' });
        handle.store('ui.slider.handle', index);
        this.handles.push(handle);
        this.element.insert(handle);
      }, this);
        
      UI.addClassNames(this.handles, 'ui-slider-handle ui-state-default ' +
       'ui-corner-all');
      this.handles.invoke('writeAttribute', 'tabIndex', '0');
    
      this.activeHandle = this.handles.first();
    
      this.handles.invoke('observe', 'click', Event.stop);
      UI.addBehavior(this.handles, [UI.Behavior.Hover, UI.Behavior.Focus]);
    
      this.observers = {
        focus:          this.focus.bind(this),
        blur:           this.blur.bind(this),
        keydown:        this.keydown.bind(this),
        keyup:          this.keyup.bind(this),
        mousedown:      this.mousedown.bind(this),
        mouseup:        this.mouseup.bind(this),
        mousemove:      this.mousemove.bind(this),
        rangeMouseDown: this.rangeMouseDown.bind(this),
        rangeMouseMove: this.rangeMouseMove.bind(this),
        rangeMouseUp:   this.rangeMouseUp.bind(this)
      };
    
      var v = opt.value;
      if (v.step !== null) {
        this._possibleValues = [];
        for (var val = v.min; val < v.max; val += v.step) {
          this._possibleValues.push(val);
        }
        this._possibleValues.push(v.max);
      
        this.keyboardStep = v.step;
      } else if (opt.possibleValues) {
        this._possibleValues = opt.possibleValues.clone();
        this.keyboardStep = null;
      } else {
        // We need a step value for incrementing via keyboard.
        this.keyboardStep = (v.max - v.min) / 100;
      }
    
      this.range = null;
      if (opt.range && this.values.length === 2) {
        this.restricted = true;
        this.range = new Element('div', { 'class': 'ui-slider-range' });
        this.element.insert(this.range);
      
        // EXPLANATION FROM jQUERY UI:
        // This isn't the most fittingly semantic framework class for this
        // element, but worked best visually with a variety of themes.
        this.range.addClassName('ui-widget-header');
      }
    
      this._computeTrackLength();
      this._computeHandleLength();
    
      this.active   = false;
      this.dragging = false;
      this.disabled = false;
    
      this.addObservers();
    
      this.values.each(this.setValue, this);
    
      this.initialized = true;
    },
  
    addObservers: function() {
      this.element.observe('mousedown', this.observers.mousedown);
      if (this.range) {
        this.range.observe('mousedown', this.observers.rangeMouseDown);
      }
      this.handles.invoke('observe', 'keydown', this.observers.keydown);
      this.handles.invoke('observe', 'keyup',   this.observers.keyup);
    },
  
    _computeTrackLength: function() {
      var length, dim;
      if (this.orientation === 'vertical') {
        dim = this.element.offsetHeight;
        length = (dim !== 0) ? dim : 
         window.parseInt(this.element.getStyle('height'), 10);
      } else {
        dim = this.element.offsetWidth;
        length = (dim !== 0) ? dim :
         window.parseInt(this.element.getStyle('width'), 10);
      }
    
      this._trackLength = length;
      return length;
    },
  
    _computeHandleLength: function() {
      var handle = this.handles.first(), length, dim;

      if (!handle) return;

      if (this.orientation === 'vertical') {
        dim = handle.offsetHeight;
        length = (dim !== 0) ? dim :
         window.parseInt(handle.getStyle('height'), 10);
        this._trackMargin = handle.getLayout().get('margin-top');
        this._trackLength -= 2 * this._trackMargin;
      } else {
        dim = handle.offsetWidth;
        length = (dim !== 0) ? dim :
         window.parseInt(handle.getStyle('width'), 10);
         this._trackMargin = handle.getLayout().get('margin-left');
         this._trackLength -= 2 * this._trackMargin;
      }

      this._handleLength = length;
      return length;
    },

    _nextValue: function(currentValue, direction) {
      if (this.options.possibleValues) {
        var index = this._possibleValues.indexOf(currentValue);
        return this._possibleValues[index + direction];
      } else {
        return currentValue + (this.keyboardStep * direction);
      }
    },
  
    keydown: function(event) {
      if (this.options.disabled) return;
    
      var handle = event.findElement();
      var index  = handle.retrieve('ui.slider.handle');
      var allow = true, opt = this.options;
    
      if (!Object.isNumber(index)) return;
    
      var interceptKeys = [Event.KEY_HOME, Event.KEY_END, Event.KEY_UP, 
       Event.KEY_DOWN, Event.KEY_LEFT, Event.KEY_RIGHT];
     
      if (!interceptKeys.include(event.keyCode)) {
        return;
      }
    
      handle.addClassName('ui-state-active');
    
      var currentValue, newValue, step = this.keyboardStep;
      currentValue = newValue = this.values[index];

      switch (event.keyCode) {
      case Event.KEY_HOME:
        newValue = opt.value.min; break;
      case Event.KEY_END:
        newValue = opt.value.max; break;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_RIGHT:
        if (currentValue === opt.value.max) return;
        newValue = this._nextValue(currentValue, 1);
        break;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_LEFT:
        if (currentValue === opt.value.min) return;
        newValue = this._nextValue(currentValue, -1);
        break;
      }
    
      // We're 'dragging' in the sense that we don't want the "changed"
      // event to fire until keyup.
      this.dragging = true;
      this.setValue(newValue, index);
    
      // In Safari, the keydown event fires repeatedly when the user holds the
      // button down. In other browsers, we have to do this manually.
      if (!Prototype.Browser.WebKit) {
        // Wait one second before repeating the first time, then 0.1 seconds
        // thereafter.
        var interval = this._timer ? 0.1 : 1;
        this._timer = arguments.callee.bind(this).delay(interval, event);
      }
    
      if (!allow) {
        event.stop();
      }
    },
  
    keyup: function(event) {
      this.dragging = false;
      if (this._timer) {
        window.clearTimeout(this._timer);
        this._timer = null;
      }
      this._updateFinished();
    
      var handle = event.findElement();
      handle.removeClassName('ui-state-active');
    },
  
    /**
     *  S2.UI.Slider#setValue(sliderValue[, handleIndex]) -> this
     *  - sliderValue (Number): The new value for the slider handle.
     *  - handleIndex (Number): The index of the handle to move (for use on
     *    sliders with more than one handle). If omitted, the first/only handle
     *    is assumed.
    **/
    setValue: function(sliderValue, handleIndex) {
      if (!this.activeHandle) {
        this.activeHandle = this.handles[handleIndex || 0];
        this._updateStyles();
      }
    
      handleIndex = handleIndex || 
       this.activeHandle.retrieve('ui.slider.handle') || 0;
     
      if (this.initialized && this.restricted) {
        // If there's more than one handle, the active one could be fenced in
        // according to the positions of adjacent handles.
        if (handleIndex > 0 && sliderValue < this.values[handleIndex - 1]) {
          sliderValue = this.values[handleIndex - 1];
        }
        if (handleIndex < (this.handles.length - 1) &&
         (sliderValue > this.values[handleIndex + 1])) {
          sliderValue = this.values[handleIndex + 1];
        }
      }
    
      sliderValue = this._getNearestValue(sliderValue);
    
      this.values[handleIndex] = sliderValue;
    
      var prop = (this.orientation === 'vertical') ? 'top' : 'left';
      var css = {};
    
      css[prop] = this._valueToPx(sliderValue) + 'px';    
      this.handles[handleIndex].setStyle(css);
    
      this._drawRange();
    
      if (!this.dragging && !this.undoing && !this.initialized)  {
        this._updateFinished();
      }

      if (this.initialized) {
        this.element.fire("ui:slider:value:changing", {
          slider: this,
          values: this.values
        });
        this.options.onSlide(this.values, this);
      }
      
      return this;
    },
  
    _getNearestValue: function(value) {
      // TODO: Implement fully.
      var range = this.options.value;
    
      if (value < range.min) value = range.min;
      if (value > range.max) value = range.max;
    
      // If `options.value.step` was specified, we're constrained to a set of
      // possible values. Figure out which two values we're between, then pick
      // the one we're closer to.
      if (this._possibleValues) {
        var left, right;
        for (var i = 0; i < this._possibleValues.length; i++) {
          right = this._possibleValues[i];
          if (right === value)  return value;
          if (right > value)    break;
        }
        left = this._possibleValues[i - 1];
        value = value.nearer(left, right);
      }
    
      return value;
    },
  
    _valueToPx: function(value) {
      var range = this.options.value;
      var pixels = (this._trackLength - this._handleLength ) /
       (range.max - range.min);
      pixels *= (value - range.min);
    
      if (this.orientation === 'vertical') {
        pixels = (this._trackLength - pixels) - this._handleLength;
      } else {
        //pixels += this._handleLength;
      }
    
      return Math.round(pixels);
    },
  
    mousedown: function(event) {
      var opt = this.options;
      if (!event.isLeftClick() || opt.disabled) return;  
      event.stop();
    
      // Remember the old values in case we have to undo the action.
      this._oldValues = this.values.clone();
    
      this.active = true;
      var target  = event.findElement();
      var pointer = event.pointer();
    
      if (target === this.element) {
        // The user clicked on the track itself.
        var trackOffset = this.element.cumulativeOffset();
      
        var newPosition = {
          x: Math.round(pointer.x - trackOffset.left - this._handleLength / 2 - this._trackMargin),
          y: Math.round(pointer.y - trackOffset.top - this._handleLength / 2 - this._trackMargin)
        };
      
        this.setValue(this._pxToValue(newPosition));
      
        this.activeHandle = this.activeHandle || this.handles.first();      
        handle = this.activeHandle;
        this._updateStyles();
        this._offsets = {x: 0, y: 0};
      } else {
        // The user clicked on a handle.
        handle = event.findElement('.ui-slider-handle');
        if (!handle) return;
      
        this.activeHandle = handle;
        this._updateStyles();
        var handleOffset = handle.cumulativeOffset();
        this._offsets = {
          x: pointer.x - (handleOffset.left + this._handleLength / 2),
          y: pointer.y - (handleOffset.top + this._handleLength / 2)
        };
      }
      
      // Listen for mousemove and mouseup on document.
      document.observe('mousemove', this.observers.mousemove);
      document.observe('mouseup',   this.observers.mouseup);
    },
  
    mouseup: function(event) {
      if (this.active && this.dragging) {
        this._updateFinished();
        event.stop();
      }
    
      this.active = this.dragging = false;
    
      this.activeHandle = null;
      this._updateStyles();
    
      document.stopObserving('mousemove', this.observers.mousemove);
      document.stopObserving('mouseup',   this.observers.mouseup);
    },
  
  
    mousemove: function(event) {
      if (!this.active) return;
      event.stop();
    
      this.dragging = true;    
      this._draw(event);
    
      if (Prototype.Browser.WebKit) window.scrollBy(0, 0);    
    },
  
    rangeMouseDown: function(event) {
      var pointer = event.pointer();

      var trackOffset = this.element.cumulativeOffset();
    
      var newPosition = {
        x: Math.round(pointer.x - trackOffset.left),
        y: Math.round(pointer.y - trackOffset.top)
      };
    
      this._rangeInitialValues = this.values.clone();
      this._rangePseudoValue = this._pxToValue(newPosition);
    
      document.observe('mousemove', this.observers.rangeMouseMove);
      document.observe('mouseup',   this.observers.rangeMouseUp);    
    },
  
    rangeMouseMove: function(event) {
      this.dragging = true;
      event.stop();
    
      var opt = this.options;
    
      var pointer = event.pointer();
      var trackOffset = this.element.cumulativeOffset();
    
      var newPosition = {
        x: Math.round(pointer.x - trackOffset.left),
        y: Math.round(pointer.y - trackOffset.top)
      };
    
      var value = this._pxToValue(newPosition);    
      var valueDelta = value - this._rangePseudoValue;
      var newValues = this._rangeInitialValues.map(
       function(v) { return v + valueDelta; });

      // The range will stay the same size no matter what. That means it's
      // restricted from moving past the min or max.
      if (newValues[0] < opt.value.min) {
        valueDelta = opt.value.min - this._rangeInitialValues[0];
        newValues = this._rangeInitialValues.map(
         function(v) { return v + valueDelta; });
      } else if (newValues[1] > opt.value.max) {
        valueDelta = opt.value.max - this._rangeInitialValues[1];
        newValues = this._rangeInitialValues.map(
         function(v) { return v + valueDelta; });
      }
    
      newValues.each(this.setValue, this);
    },
  
    rangeMouseUp: function(event) {
      this.dragging = false;

      document.stopObserving('mousemove', this.observers.rangeMouseMove);
      document.stopObserving('mouseup',   this.observers.rangeMouseUp);
    
      this._updateFinished();
    },
  
  
    _draw: function(event) {
      var pointer = event.pointer();
      var trackOffset = this.element.cumulativeOffset();
    
      pointer.x -= (this._offsets.x + trackOffset.left + this._handleLength / 2 + this._trackMargin);
      pointer.y -= (this._offsets.y + trackOffset.top + this._handleLength / 2 + this._trackMargin);
    
      this.setValue(this._pxToValue(pointer));
    },
  
    _pxToValue: function(offsets) {
      var opt = this.options;
      var offset = (this.orientation === 'horizontal') ?
       offsets.x : offsets.y;
     
      var value = ((offset / (this._trackLength - this._handleLength) * 
       (opt.value.max - opt.value.min)) + opt.value.min);
     
      // Invert the value if it's vertical. Because a higher pixel value
      // means a lower value.
      if (this.orientation === 'vertical') {
        value = opt.value.max - (value - opt.value.min);
      }
     
      return value;
    },
  
    /** 
     *  S2.UI.Slider#undo() -> this
     *  
     *  Reverts the effect of the previous call to [[S2.UI.Slider#setValue]].
    **/
    undo: function() {
      if (!this._oldValues) return;
      this.values = this._oldValues.clone();
    
      this.undoing = true;
      this._oldValues.each(this.setValue, this);
      this.undoing = false;
    },
  
    _updateFinished: function() {
      var result = this.element.fire("ui:slider:value:changed", {
        slider: this,
        values: this.values
      });
    
      if (result.stopped) {
        this.undo();
        return;
      }
    
      this.activeHandle = null;
      this._updateStyles();
      
      this.options.onChange(this.values, this);
    },
  
    _updateStyles: function() {
      UI.removeClassNames(this.handles, 'ui-state-active');
      if (this.activeHandle) {
        this.activeHandle.addClassName('ui-state-active');      
      }
    },
  
    _drawRange: function() {    
      if (!this.range) return;
      var values = this.values, pixels = values.map(this._valueToPx, this);
    
      if (this.orientation === 'vertical') {
        this.range.setStyle({
          top: pixels[1] + 'px',
          height: (pixels[0] - pixels[1]) + 'px'
        });
      } else {
        this.range.setStyle({
          left:   pixels[0] + 'px',
          width:  (pixels[1] - pixels[0]) + 'px'
        });
      }
    },

    focus: function(event) {
      if (this.options.disabled) return;
    
      var handle = event.findElement();
    
      this.element.select('.ui-state-focus').invoke(
       'removeClassName', 'ui-state-focus');
    
      handle.addClassName('ui-state-focus');
    },
  
    blur: function(event) {
      event.findElement().removeClassName('ui-state-focus');
    }
  });

  Object.extend(UI.Slider, {
    DEFAULT_OPTIONS: {
      range: false,
      disabled: false,
      value: { min: 0, max: 100, initial: 0, step: null },
      possibleValues: null,
      orientation: 'horizontal',
    
      onSlide:  Prototype.emptyFunction,
      onChange: Prototype.emptyFunction
    }
  });
})(S2.UI);

