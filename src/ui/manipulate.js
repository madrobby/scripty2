/** section: scripty2 ui
 * S2.UI.Multitouch
 * Multitouch extensions.
 * The `manipulate:update` event is fired when an element is "manipulated", 
 * which means when it is panned, scaled or rotated. Consumers of this event
 * do not need to worry about how the system determines if a manipulation
 * takes place.
 * 
 * For now, Multitouch support needs to explicitly enabled, by setting 
 *
 *     <script>S2.enableMultitouchSupport = true;</script>
 *
 * before the DOM is fully loaded (you can insert this snippet just before the
 * BODY tag ends).
 *
 * Currently, there's two different "input modes", that fire the event, with
 * two multitouch APIs supported:
 *
 * <img src="../../../images/manipulate.png" alt="Manipulations"/>
 *
 * * Nokia's Multitouch API - on supported devices/browsers, 
 *   touching an element with one or more fingers fire the manipulate:update event. 
 *   Panning, scaling and rotation can take place at the same time.
 * * Apple's Touch API - on iOS devices (Safari/WebKit on iPad, iPhone and iPod touch), 
 *   touching an element with one or more fingers fire the manipulate:update 
 *   event. Panning, scaling and rotation can take place at the same time.
 * * Mouse dragging (with optional shift key) - on all other browsers, 
 *   manipulate:update events are fired when clicking on an element with the mouse, 
 *   and then moving the mouse with the mouse button held down. Pressing the shift key 
 *   when clicking the element toggles to rotation/scale mode, from the default panning mode.
 *
 * In addition to the usual event information, the manipulate:update event sends along four 
 * pieces of information in it's `memo` property:
 *
 *     { panX: 12, panY: -110, rotation: 1.5707633, scale: 1.2 }
 *     // panned 12px to the right, 110px up, about 90° rotated, scaled up by 20%
 *
 *
 * * `panX` and `panY` contain information about how an element was moved, 
 *   relatively to it's original page position. These values are given in pixels. 
 *   These panning coordinates persist between individual touch and dragging actions. 
 *   If two fingers are used to drag, the panning is relative to the mid point 
 *   between those two touches. On browsers or hardware without touch or multitouch support, 
 *   dragging with the mouse initiates manipulate:update events that contain panX and panY information.
 * * `rotation` contains an element's rotation relative to it's original position 
 *   (set with [[Element#transform]]). This value is given in radians. If multitouch is supported, 
 *   the element can be rotated by using two fingers and making a rotation movement. On browsers or 
 *   hardware without touch or multitouch support, dragging with the mouse while holding down the 
 *   shift key initiates rotation (and scaling), relative to the element's mid-point.
 * * `scale` contains an element's scale factor, relative to it's original scale 
 *   (set with Element#transform). This value is a factor of the original size, 
 *   where 1 is equal to the original size, 2 is twice the size, 0.5 half the size, and so on. 
 *   If multitouch is supported, the element can be scaled by using two fingers and making a 
 *   pinch or reverse-pinch (expand) movement. On browsers or hardware without touch or multitouch 
 *   support, dragging with the mouse while holding down the shift key initiates scaling 
 *   (and rotation), relative to the element's mid-point.
 *
 * Example for observing manipulations and logging the components:
 *
 *     $('element_id').observe('manipulate:update', function(event){
 *       console.log(Object.toJSON(event.memo));
 *     });
**/

document.observe('dom:loaded',function(){
  if(!S2.enableMultitouchSupport) return;
  
  var b = $(document.body), sequenceId = 0;
  
  function initElementData(element){
    element._rotation = element._rotation || 0;
    element._scale = element._scale || 1;
    element._panX = element._panX || 0;
    element._panY = element._panY || 0;
    element._pans = [[0,0],[0,0],[0,0]];
    element._panidx = 1;
  }
  
  function setElementData(element, rotation, scale, panX, panY){
    element._rotation = rotation;
    element._scale = scale;
    element._panX = panX;
    element._panY = panY;
  }
  
  function fireEvent(element, data){
    element.fire('manipulate:update', 
      Object.extend(data, { id: sequenceId }));
  }
  
  function setupIPhoneEvent(){
    var element, rotation, scale,
      touches = {}, t1 = null, t2 = null, state = 0, oX, oY,
      offsetX, offsetY, initialDistance, initialRotation;
    function updateTouches(touchlist){
      var i = touchlist.length;
      while(i--) touches[touchlist[i].identifier] = touchlist[i];
      var l = []; for(k in touches) l.push(k); l = l.sort();
      t1 = l.length > 0 ? l[0] : null;
      element = t1 ? touches[t1].target : null;
      if(element && element.nodeType==3) element = element.parentNode;
      t2 = l.length > 1 ? l[1] : null;
      if(state==0 && (t1&&t2)) {
        offsetX = (touches[t1].pageX-touches[t2].pageX).abs();
        offsetY = (touches[t1].pageY-touches[t2].pageY).abs();
        if(element) initElementData(element);
        initialDistance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
        initialRotation = Math.atan2(touches[t2].pageY-touches[t1].pageY,touches[t2].pageX-touches[t1].pageX);
        state = 1;
        return;
      }
      if(state==1 && !(t1&&t2)) {
        if(element) setElementData(element, rotation, scale);
        state = 0;
      }
    }
    function touchCount(){
      var c=0; for(k in touches) c++; return c;
    }

    b.observe('touchstart', function(event){
      var t = t1, o;
      updateTouches(event.changedTouches);
      if(t==null && t1) {
        o = element.viewportOffset();
        oX = o.left+(touches[t1].pageX-o.left), oY = o.top+(touches[t1].pageY-o.top);
      }
      event.stop();
    });
    b.observe('touchmove', function(event){
      updateTouches(event.changedTouches);
      if(t1&&!t2) {
        fireEvent(element, {
          panX: (element._panX||0)+touches[t1].pageX-oX,
          panY: (element._panY||0)+touches[t1].pageY-oY,
          scale: element._scale,
          rotation: element._rotation
        });
        event.stop();
        return;
      }
      if(!(t1&&t2)) return;
      var a = touches[t2].pageX-touches[t1].pageX,
        b = touches[t2].pageY-touches[t1].pageY,
        cX = (element._panX||0) + touches[t2].pageX - a/2 - oX,
        cY = (element._panY||0) + touches[t2].pageY - b/2 - oY,
        distance = Math.sqrt(a*a + b*b);

      scale = element._scale * distance/initialDistance;
      rotation = element._rotation + Math.atan2(b,a) - initialRotation;

      fireEvent(element, { rotation: rotation, scale: scale, panX: cX, panY: cY });
      event.stop();
    });
    ['touchcancel','touchend'].each(function(eventName){
      b.observe(eventName, function(event){
        var i = event.changedTouches.length;
        while(i--) delete(touches[event.changedTouches[i].identifier]);
        updateTouches([]);
        if(element) setElementData(element, rotation, scale);
      });
    });
  }
  
  function setupBridgedEvent(){
    var element, rotation, scale, panX, panY, active = false;
    
    b.observe('touchstart', function(event){
      event.preventDefault();
    });
    
    b.observe('transformactionstart', function(event){
      // for now, always stop the default manipulation events
      // this prevents Starlight from zooming/panning the window
      // with touching
      event.stop();
      
      element = event.element();
      initElementData(element);
      active = true;
    });    
    b.observe('transformactionupdate', function(event){
      element = event.element();
      rotation = element._rotation + event.rotate;
      scale = element._scale * event.scale;
      panX = element._panX + event.translateX;
      panY = element._panY + event.translateY;
      
      fireEvent(element, { 
        rotation: rotation, scale: scale,
        panX: panX, panY: panY,
        clientX: event.clientX, clientY: event.clientY
      });
      event.stop();
    }, false);
    b.observe('transformactionend', function(event){
      element = event.element();
      if(element) setElementData(element, rotation, scale, panX, panY);
      active = false;
      
      var speed = Math.sqrt(event.translateSpeedX*event.translateSpeedX + 
          event.translateSpeedY*event.translateSpeedY);
        
      if(speed>25){
        //$('debug').innerHTML = speed+',x:'+event.panSpeedX+',y:'+event.panSpeedY;
        element.fire('manipulate:flick', { 
          speed: speed, 
          direction: Math.atan2(event.translateSpeedY,event.translateSpeedX) 
        });
      }
    });
    b.on('mousemove', function(event){
      event.stop();
    });
    b.on('mousedown', function(event){
      event.stop();
    });
    b.on('mouseup', function(event){
      event.stop();
    });
  }
  
  // when shift is pressed, do mouse-based manipulate scale/rotate events
  // if not, do mouse-based panning manipulate events
  // todo: refactoring and performance optimization
  function setupGenericEvent(){
    var mX, mY, active = false, listen = true, element, mode,
      initialDistance, initialRotation, oX, oY, rotation, scale, distance;
    function objectForScaleEvent(event){
      var o = element.viewportOffset(),
        a = (event.pageX-o.left)-mX, 
        b = (event.pageY-o.top)-mY;
      distance = Math.sqrt(a*a + b*b);
      scale = element._scale * distance/initialDistance;
      rotation = element._rotation + Math.atan2(b,a) - initialRotation;
      return { 
        rotation: rotation, scale: scale, 
        panX: element._panX, panY: element._panY };
    }
    function objectForPanEvent(event){
      return { 
        rotation: element._rotation, scale: element._scale, 
        panX: element._panX+event.pageX-oX, panY: element._panY+event.pageY-oY };
    }
    b.observe('mousedown', function(event){
      mode = event.shiftKey ? 'scale' : 'pan';
      element = event.element();
      if(!(element && element.fire)) return;
      sequenceId++;
      active = true;
      initElementData(element);
      var o =  element.viewportOffset();
      mX = element.offsetWidth/2; 
      mY = element.offsetHeight/2;
      var a = event.pageX-o.left-mX, b = event.pageY-o.top-mY;
      initialDistance = Math.sqrt(a*a+b*b);
      initialRotation = Math.atan2(b,a);
      oX = o.left+(event.pageX-o.left), oY = o.top+(event.pageY-o.top);
      event.stop();
    });
    b.observe('mousemove', function(event){
      if(!active) return;
      fireEvent(element, mode == 'scale' ? objectForScaleEvent(event) : objectForPanEvent(event));
    });
    b.observe('mouseup', function(event){
      if(!active) return;
      active = false;
      if(mode=='scale'){
        var o = objectForScaleEvent(event);
        fireEvent(element, o);
        element._rotation = o.rotation;
        element._scale = o.scale;
      } else {
        fireEvent(element, objectForPanEvent(event));
        element._panX = element._panX+event.pageX-oX;
        element._panY = element._panY+event.pageY-oY;
      }
    });
    b.observe('dragstart', function(event){ event.stop(); });
  }
  
  try {
    document.createEvent("TransformActionEvent");
    return setupBridgedEvent();
  } catch(e) {}

  try {
    document.createEvent("TouchEvent");
    return setupIPhoneEvent();
  } catch(e) {}
  
  return setupGenericEvent(); 
});