/**
 *  S2.viewportOverlay() -> element
 *  
 *  Creates a new absolutely positioned DIV element with the dimensions of the viewport.
 *  The element is not inserted into the DOM.
 *
 *  This can be used for a quick overlay like this:
 *
 *      $(document.body).insert(S2.viewportOverlay().setStyle('background:#000;opacity:0.5'));
 *
**/

S2.viewportOverlay = function(){
  var viewport = document.viewport.getDimensions(),
    offsets = document.viewport.getScrollOffsets();
  return new Element('div').setStyle({
    position: 'absolute',
    left: offsets.left + 'px', top: offsets.top + 'px',
    width: viewport.width + 'px', height: viewport.height + 'px'
  });
};