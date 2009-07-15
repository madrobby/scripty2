S2.UI.DraggableEmitter = (function(){
  var methods = [];
  
  function setup(){
    methods.each(function(method){ method() });
  }
  
  return { setup: setup, add: methods.push.bind(methods) };
})();

S2.UI.DraggableEmitter.Desktop = function(){
  var element;
  
  function fire(eventName, event){
    element.fire('S2:internal:drag:'+eventName, event.pointer());
  }
  
  function propose(event){
    if(element) return;
    if(!event.isLeftClick()) return;
    element = event.element();
    var offset = element.cumulativeOffset();
    fire('proposed', event);
  }
  
  function update(event){
    if(!element) return;
    fire('updated', event);
  }
  
  function end(event){
    if(!element) return;
    fire('ended', event);
    element = null;
  }
  
  function abortOnESC(event){
    if(!element) return;
    fire('aborted', event);
    element = null;
  }
  
  document
    .observe('mousedown', propose)
    .observe('mousemove', update)
    .observe('mouseup', end)
    .observe('keypress', abortOnESC);
};

S2.UI.DraggableEmitter.add(S2.UI.DraggableEmitter.Desktop);
