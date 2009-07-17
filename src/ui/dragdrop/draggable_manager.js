S2.UI.DraggableManager = (function(){
  var draggables = [], activeDraggable, initialized = false;

  function start(event){
    if(activeDraggable) return;
    var element = event.element();
    do {
      if((activeDraggable = element.retrieve('S2.UI.Draggable')) && activeDraggable.isEnabled()) break;
    } while (element = element.parentNode);
    if(!activeDraggable) return;

    console.log(event.memo);
    activeDraggable.startDrag(event.memo);
  }

  function update(event){
    // ask draggable for constraints
    // update draggable
    if(!activeDraggable) return;
    activeDraggable.updateDrag(event.memo);
  }

  function end(event){
    //
    if(!activeDraggable) return;
    activeDraggable.endDrag(event.memo);
    activeDraggable = null;
  }

  function abort(){
    if(!activeDraggable) return;
    //
  }

  function setup(){
    S2.UI.DraggableEmitter.setup();

    document
      .observe('S2:internal:drag:proposed', start)
      .observe('S2:internal:drag:updated', update)
      .observe('S2:internal:drag:ended', end)
      .observe('S2:internal:drag:aborted', abort);

    initialized = true;
  }

  function register(draggable){
    if(!initialized) setup();

    draggable.element.store('S2.UI.Draggable', draggable);
    draggables.push(draggable);
  }

  function unregister(draggable){
    draggables = draggables.without(draggable);

    // todo: cleanup? (optional?)
    // draggables.remove(draggable);
  }

  return {
    register: register,
    unregister: unregister
  }
})();
