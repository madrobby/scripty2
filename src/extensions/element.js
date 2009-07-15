/** section: scripty2 fx
 * Element
 *
 * A collection of shortcut methods that are added to all DOM elements.
**/
Element.__scrollTo = Element.scrollTo;
Element.addMethods({
  /** 
   *  Element.scrollTo(@element[, to[, options]]) -> element
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
    new s2.fx.Scroll(element, Object.extend(options || {}, { to: to })).play();
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
      effect = new s2.fx[effect.capitalize()](element, options);
    effect.play(element, options);
    return element;
  },

  /** 
   *  Element.morph(@element, style[, options]) -> element
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
   *  By default, `morph` will create a new [[s2.fx.Queue]] for the
   *  element if there isn't on already, and use this queue for queueing
   *  up chained morphs. To prevent a morph from queuing at the end,
   *  use the `position: 'parallel'` option.
   *
   *      // the height morph will be executed at the same time as the width morph
   *      $('element_id').morph('width:500px').morph('height:500px',{ position: 'parallel' });
   *
   *  See also [[s2.fx.Morph]].
  **/
  morph: function(element, style, options){
    options = s2.fx.parseOptions(options);
    if(!options.queue){
      options.queue = element.retrieve('s2.fx.Queue');
      if(!options.queue)
        element.store('s2.fx.Queue', options.queue = new s2.fx.Queue());
    }
    if(!options.position) options.position = 'end';
    return element.effect('morph', Object.extend(options, {style: style}));
  }.optionize(),

  /** 
   *  Element.appear(@element[, options]) -> element
   *
   *  Make an element appear by fading it in from 0% opacity.
  **/
  appear: function(element, options){
    return element.effect('morph', Object.extend({
      before: function(){ element.show().setStyle({opacity: 0}); },
      style:  'opacity:1'
    }, options));
  },

  /** 
   *  Element.fade(@element[, options]) -> element
   *
   *  Fade out an element from it's current opacity setting (or 100%).
  **/
  fade: function(element, options){
    return element.effect('morph', Object.extend({
      style: 'opacity:0',
      after: element.hide.bind(element)
    }, options));
  },

  /** 
   *  Element.cloneWithoutIDs(@element) -> element
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
