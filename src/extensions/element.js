/** section: scripty2 fx
 * Element
 *
 * A collection of shortcut methods that are added to all DOM elements.
**/
Element.__scrollTo = Element.scrollTo;
Element.addMethods({
  /** 
   *  Element#scrollTo(@element[, to[, options]]) -> element
   *  - to (Number): vertical scroll position in pixels
   *  - options (Object): effect options
   *
   *  This method augments Prototype's Element.scrollTo method.
   *
   *  With just the `@element` parameter given, it will revert to
   *  Prototype's default implementation: the viewport will be scrolled
   *  (without animation) to contain the element.
   *  
   *  If given the `to` parameter, the elements contents will be 
   *  smoothly scrolled to the specified scrollTop position.
  **/  
  scrollTo: function(element, to, options){
    if(arguments.length == 1) return Element.__scrollTo(element);
    new S2.FX.Scroll(element, Object.extend(options || {}, { to: to })).play();
    return element;
  }
});

Element.addMethods({
  /** 
   *  Element.effect(@element, effect[, options]) -> element
   *
   *  Initialize and play the specified effect on the element.
  **/
  effect: function(element, effect, options){
    if (Object.isFunction(effect))
      effect = new effect(element, options);
    else if (Object.isString(effect))
      effect = new S2.FX[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
    effect.play(element, options);
    return element;
  },

  /** 
   *  Element#morph(@element, style[, options]) -> element
   *
   *  Dynamically adjust an element's CSS styles to the CSS properties given
   *  in the `style` argument. 
   *  
   *  This method is the preferred way to invoke CSS-based effects:
   *
   *      $('element_id').morph('width:500px');
   *      $('element_id').morph('width:500px', 'slow');
   *      $('element_id').morph('width:500px', function(){ alert('finished!'); });
   *      $('element_id').morph('width:500px', 2); // duration 2 seconds
   *  
   *  Complex options can be specified with an Object literal:
   *
   *      $('element_id').morph('width:500px;height:500px', {
   *        duration: 4,
   *        transition: 'linear',
   *        delay: .5, 
   *        propertyTransitions: {
   *          width: 'mirror', height: 'easeInOutCirc'
   *        },
   *        after: function(){ alert('finished');  }
   *      });
   *
   *  Morphs can be chained:
   *
   *      // the height morph will be executed immediately following
   *      // the width morph
   *      $('element_id').morph('width:500px').morph('height:500px');
   *
   *  By default, `morph` will create a new [[S2.FX.Queue]] for the
   *  element if there isn't one already, and use this queue for queueing
   *  up chained morphs. To prevent a morph from queuing at the end,
   *  use the `position: 'parallel'` option.
   *
   *      // the height morph will be executed at the same time as the width morph
   *      $('element_id').morph('width:500px').morph('height:500px', { position: 'parallel' });
   *
   *  See also [[S2.FX.Morph]].
  **/
  morph: function(element, style, options) {
    options = S2.FX.parseOptions(options);
    if (!options.queue) {
      options.queue = element.retrieve('S2.FX.Queue');
      if (!options.queue) {
        element.store('S2.FX.Queue', options.queue = new S2.FX.Queue());
      }
    }
    if (!options.position) options.position = 'end';
    return element.effect('morph', Object.extend(options, { style: style }));
  }.optionize(),

  /** 
   *  Element#appear(@element[, options]) -> element
   *
   *  Make an element appear by fading it in from 0% opacity.
  **/
  appear: function(element, options){
    return element.setStyle('opacity: 0;').show().morph('opacity: 1', options);    
  },

  /** 
   *  Element#fade(@element[, options]) -> element
   *
   *  Fade out an element from its current opacity setting (or 100%).
  **/
  fade: function(element, options){
    options = Object.extend({
      after: Element.hide.curry(element)
    }, options || {});
    return element.morph('opacity: 0', options);
  },

  /** 
   *  Element#cloneWithoutIDs(@element) -> element
   *
   *  Returns a clone of the element with all `id` attributed removed.
  **/
  cloneWithoutIDs: function(element) {
    element = $(element);
    var clone = element.cloneNode(true);
    clone.id = '';
    $(clone).select('*[id]').each(function(e) { e.id = ''; });
    return clone;
  }
});

/** 
 *  Element#transform(@element, transforms) -> element
 *  - transforms (Object): rotation angle and scale factor
 *
 *  Rotate and scale an element. `transforms` is an object containing:
 *
 *  * `rotation`: Rotation angle in radians
 *  * `scale`: Scale factor
 *
 *  Example:
 *
 *      // rotate by 1.5 radians, scale by 200%
 *      $('element_id').transform({ rotation: 1.5, scale: 2 });
 *  
 *  [[manipulate:update]] event memos can be directly fed into [[Element#transform]]:
 *
 *      $('element_id').observe('manipulate:update', function(event){
 *         $('element_id').transform(event.memo);
 *      });
 *
 *  To convert degrees to radians, use:
 *
 *      radians = degrees * (Math.PI/180);
 *  
**/
(function(){
  var transform;
  
  if(window.CSSMatrix) transform = function(element, transform){
    element.style.transform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  else if(window.WebKitCSSMatrix) transform = function(element, transform){
    element.style.webkitTransform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  else if(Prototype.Browser.Gecko) transform = function(element, transform){
    element.style.MozTransform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  // we don't support scaling for IE yet
  else if(Prototype.Browser.IE) transform = function(element, transform){
    if(!element._oDims)
      element._oDims = [element.offsetWidth, element.offsetHeight];
    var c = Math.cos(transform.rotation||0) * 1, s = Math.sin(transform.rotation||0) * 1,
        filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11="+c+",M12="+(-s)+",M21="+s+",M22="+c+")";
    element.style.filter = filter;
    element.style.marginLeft = (element._oDims[0]-element.offsetWidth)/2+'px';
    element.style.marginTop = (element._oDims[1]-element.offsetHeight)/2+'px';
    return element; 
  };
  else transform = function(element){ return element; }
  
  Element.addMethods({ transform: transform });
})();
