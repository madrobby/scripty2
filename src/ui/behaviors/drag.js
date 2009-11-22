/** section: scripty2 ui
 *  class S2.UI.Behavior.Drag < S2.UI.Behavior
 *  
 *  Applies a drag behavior. Takes a `handle` option that points to the drag
 *  handle; if omitted, the entire element will be draggable.
**/
S2.UI.Behavior.Drag = Class.create(S2.UI.Behavior, {
  initialize: function($super, element, options) {
    this.__onmousemove = this._onmousemove.bind(this);
    $super(element, options);
    this.element.addClassName('ui-draggable');
  },
  
  destroy: function($super) {
    this.element.removeClassName('ui-draggable');
    $super();
  },
  
  "handle/onmousedown": function(event) {
    var element = this.element;
    this._startPointer  = event.pointer();
    this._startPosition = {
      left: window.parseInt(element.getStyle('left'), 10),
      top:  window.parseInt(element.getStyle('top'),  10)
    };
    document.observe('mousemove', this.__onmousemove);
  },
  
  "handle/onmouseup": function(event) {
    this._startPointer  = null;
    this._startPosition = null;
    document.stopObserving('mousemove', this.__onmousemove);
  },
  
  _onmousemove: function(event) {
    var pointer = event.pointer();

    // Can sometimes happen if the pointer exited the window during
    // mousedown.
    if (!this._startPointer) return;
    
    var delta = {
      x: pointer.x - this._startPointer.x,
      y: pointer.y - this._startPointer.y
    };
    
    var newPosition = {
      left: (this._startPosition.left + delta.x) + 'px',
      top:  (this._startPosition.top  + delta.y) + 'px'
    };
    
    this.element.setStyle(newPosition);    
  }
});
