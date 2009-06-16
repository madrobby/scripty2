/** section: scripty2 fx
 * Element
 *
 * A collection of shortcut methods that are added to all DOM elements.
 * [[Element.Morph]] is the preferred way to invoke morph effects.
**/
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
   *  in the `style` argument. See [[s2.fx.Morph]].
  **/
  morph: function(element, style, options){
    options = s2.fx.parseOptions(options);
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
    return element.effect(Effect.Morph, Object.extend({
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