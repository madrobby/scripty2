Effect.Helpers = { 
  fitIntoRectangle: function(w, h, rw, rh){
    var f = w/h, rf = rw/rh; return f < rf ? 
    [(rw - (w*(rh/h)))/2, 0, w*(rh/h), rh] : 
    [0, (rh - (h*(rw/w)))/2, rw, h*(rw/w)];
  },

  viewportOverlay: function() {
    var viewport = document.viewport.getDimensions();
    var offsets = document.viewport.getScrollOffsets();
    return new Element('div').setStyle({
      position: 'absolute',
      left: offsets.left + 'px', top: offsets.top + 'px',
      width: viewport.width + 'px', height: viewport.height + 'px'
    });
  }
};