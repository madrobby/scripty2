Effect.Operators.Zoom = Class.create(Effect.Operators.Style, {
  initialize: function($super, object, options) {
    var viewport = document.viewport.getDimensions();
    var offsets = document.viewport.getScrollOffsets();
    var dims = object.getDimensions();

    var f = Effect.Helpers.fitIntoRectangle(dims.width, dims.height, 
      viewport.width - (options.borderWidth || 0)*2, 
      viewport.height - (options.borderWidth || 0)*2);
    
    Object.extend(options, { style: {
      left: f[0] + (options.borderWidth || 0) + offsets.left + 'px', 
      top: f[1] + (options.borderWidth || 0) + offsets.top + 'px',
      width: f[2] + 'px', height: f[3] + 'px'
    }});
    $super(object, options);
  }
});

Effect.Zoom = Class.create(Effect.Element, {
  setup: function() {
    this.clone = this.element.cloneWithoutIDs();
    this.element.insert({before:this.clone});
    this.clone.absolutize().setStyle({zIndex:9999});
    
    this.overlay = Effect.Helpers.viewportOverlay();
    if (this.options.overlayClassName) 
      this.overlay.addClassName(this.options.overlayClassName)
    else
      this.overlay.setStyle({backgroundColor: '#000', opacity: '0.9'});
    $$('body')[0].insert(this.overlay);
    
    this.animate('zoom', this.clone, { 
      borderWidth: this.options.borderWidth,
      propertyTransitions: this.options.propertyTransitions || { }
    });
  },
  teardown: function() {
    this.clone.observe('click', function() {
      this.overlay.remove();
      this.clone.morph('opacity:0', { 
        duration: 0.2,
        after: function() {
          this.clone.remove();
        }.bind(this) 
      });
    }.bind(this));
  }
});