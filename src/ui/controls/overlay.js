(function(UI) {
  
  /** section: scripty2 ui
   *  class S2.UI.Overlay < S2.UI.Base
   *  includes S2.UI.Mixin.Shim, S2.UI.Mixin.Trackable
   *  
   *  A class for display a modal overlay on screen.
  **/

  UI.Overlay = Class.create(
   UI.Base,
   UI.Mixin.Trackable,
   UI.Mixin.Shim, {
    NAME: "S2.UI.Overlay",
     
    /**
     *  new S2.UI.Overlay(options)
    **/
    initialize: function(options) {
      this.setOptions(options);
      this.element = new Element('div', {
        'class': 'ui-widget-overlay'
      });

      this.register();
      this.createShim();
      this.adjustShim();
      this.constructor.onResize();      
    },

    destroy: function() {
      this.element.remove();
      this.unregister();
    },

    toElement: function() {
      return this.element;
    }
  });

  Object.extend(UI.Overlay, {
    onRegister: function() {
      if (this.instances.length !== 1) return;

      this._resizeObserver = this._resizeObserver || this.onResize.bind(this);
      Event.observe(window, 'resize', this._resizeObserver);
      Event.observe(window, 'scroll', this._resizeObserver);
    },

    onUnregister: function() {
      if (this.instances.length !== 0) return;    
      Event.stopObserving(window, 'resize', this._resizeObserver);
      Event.stopObserving(window, 'scroll', this._resizeObserver);
    },

    onResize: function() {
      var vSize   = document.viewport.getDimensions();
      var offsets = document.viewport.getScrollOffsets();
      this.instances.each( function(instance) {
        var element = instance.element;
        element.setStyle({
          width:  vSize.width  + 'px',
          height: vSize.height + 'px',
          left:   offsets.left + 'px',
          top:    offsets.top  + 'px'
        });
      });
      (function() {
        this.instances.invoke('adjustShim');
      }).bind(this).defer();
    }
  });
  
})(S2.UI);