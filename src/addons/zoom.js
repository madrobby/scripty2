s2.fx.Helpers = { 
  fitIntoRectangle: function(w, h, rw, rh){
    var f = w/h, rf = rw/rh; return f < rf ? 
      [(rw - (w*(rh/h)))/2, 0, w*(rh/h), rh] : 
      [0, (rh - (h*(rw/w)))/2, rw, h*(rw/w)];
  }
};

s2.fx.Operators.Zoom = Class.create(s2.fx.Operators.Style, {
  initialize: function($super, object, options) {
    var viewport = document.viewport.getDimensions(),
      offsets = document.viewport.getScrollOffsets(),
      dims = object.getDimensions(),
      f = s2.fx.Helpers.fitIntoRectangle(dims.width, dims.height, 
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

s2.fx.Zoom = Class.create(s2.fx.Element, {
  setup: function() {
    this.clone = this.element.cloneWithoutIDs();
    this.element.insert({before:this.clone});
    this.clone.absolutize().setStyle({zIndex:9999});
    
    this.overlay = s2.fx.Helpers.viewportOverlay();
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