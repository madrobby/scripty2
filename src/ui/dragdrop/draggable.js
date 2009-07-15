//= require "draggable_manager"

S2.UI.AbstractDraggable = Class.create(S2.Mixin.Configurable, {
  initialize: function(element, options){
    this.element = $(element);
    this.setOptions(options);
    this.enable();
    this.dragging = false;
    S2.UI.DraggableManager.register(this);
  },
  
  isEnabled: function(){
    return this.enabled;
  },
  enable: function(){
    this.enabled = true;
  },
  disable: function(){
    this.disabled = false;
  },
  
  fire: function(eventName, position){
    this.element.fire('drag:'+eventName, {
      draggable: this,
      element: this.element,
      position: position
    });
  },
  
  startDrag: function(position){
    if(!this.isEnabled()) return;
    this.dragging = true;
    
    var offset = this.element.cumulativeOffset();
    console.log(position);
    this.delta = { x: position.x-offset[0], y: position.y-offset[1] };

    this.render(position);
    this.fire('started', position);
  },
  
  updateDrag: function(position){
    if(!this.dragging) return;
    this.render(position);
    this.fire('updated', position);
  },
  
  endDrag: function(position){
    if(!this.dragging) return;
    this.render(position);
    this.dragging = false;
    this.fire('ended', position);
  },
    
  render: function(position){
    this.draw({
      x: position.x - this.delta.x,
      y: position.y - this.delta.y
    });
  },
  
  remove: function(){
    // todo
    S2.UI.DraggableManager.unregister(this);
  }
});

S2.UI.AbstractDraggable.DEFAULT_OPTIONS = {
  whatever: 'sure'
};

S2.UI.Draggable = Class.create(S2.UI.AbstractDraggable, {
  draw: function(position){
    this.element.setStyle('left:'+position.x+'px;top:'+position.y+'px');
  }
});