//= require "operators/style"

/**
 *  class S2.FX.Morph < S2.FX.Element
 *  
 *  "Morph" DOM elements to a new set of CSS style rules, while optionally
 *  providing a new set of contents.
 *
 *  <h4>Preferred syntax</h4>
 *  
 *  It is recommended to use the shorthand syntax, for example:
 *
 *      $('element_id').morph('width:300px;color:#fff', { duration: .7 });
 *
 *  <h4>Supported CSS properties</h4>
 *
 *  The following CSS properties are supported by this effect:
 *  `background-color (color)`, `border-bottom-color (color)`, 
 *  `border-bottom-width (length)`, `border-left-color (color)`, 
 *  `border-left-width (length)`, `border-right-color (color)`, 
 *  `border-right-width (length)`,  `border-spacing (length)`, 
 *  `border-top-color (color)`, `border-top-width (length)`, 
 *  `bottom (length)`, `color (color)`, `font-size (length)`, 
 *  `font-weight (integer)`, `height (length)`, `left (length)`, 
 *  `letter-spacing (length)`, `line-height (length)`, 
 *  `margin-bottom (length)`, `margin-left (length)`, `margin-right (length)`, 
 *  `margin-top (length)`, `max-height (length)`, `max-width (length)`, 
 *  `min-height (length)`, `min-width (length)`, `opacity (number)`, 
 *  `outline-color (color)`, `outline-offset (length)`, 
 *  `outline-width (length)`, `padding-bottom (length)`, 
 *  `padding-left (length)`, `padding-right (length)`, `padding-top (length)`, 
 *  `right (length)`, `text-indent (length)`, `top (length)`, `width (length)`, 
 *  `word-spacing (length)`, `z-index (integer)` and `zoom (number)`.
 *
 *  In addition, shorthand CSS properties for these also work:
 *  
 *      $('element_id').setStyle('border:2px solid #cba;border-bottom-width:100px');
 *      $('element_id').morph('border:12px solid #abc', { duration: .7 });
 *
 *  It is also possible to specify a [[S2.FX.Transition]] for some or all CSS properties
 *  individually for complex animation effects:
 *
 *      $('element_id').morph('top:20px;left:50px;background-color:#000',{
 *        transition: 'easeInOutExpo',
 *        propertyTransitions: { 
 *          top: 'spring', left: 'easeInOutCirc'
 *        } 
 *      });
 *
 *  These transitions are in addition to the main effect transition.
 *
 *  <h4>Try any combination of supported properties in this demo:</h4>
 *  <div id="morph_example"></div>
**/
S2.FX.Morph = Class.create(S2.FX.Element, {
  setup: function() {
    if (this.options.change) 
      this.setupWrappers();
    else if (this.options.style)
      this.animate('style', this.destinationElement || this.element, { 
        style: this.options.style,
        propertyTransitions: this.options.propertyTransitions || { }
      });
  },

  teardown: function() {
    if (this.options.change) 
      this.teardownWrappers();
  },

  setupWrappers: function() {
    var elementFloat = this.element.getStyle("float"), 
      sourceHeight, sourceWidth,
      destinationHeight, destinationWidth, 
      maxHeight;
    
    this.transitionElement = new Element('div').setStyle({ position: "relative", overflow: "hidden", 'float': elementFloat });
    this.element.setStyle({ 'float': "none" }).insert({ before: this.transitionElement });

    this.sourceElementWrapper = this.element.cloneWithoutIDs().wrap('div');
    this.destinationElementWrapper = this.element.wrap('div');

    this.transitionElement.insert(this.sourceElementWrapper).insert(this.destinationElementWrapper);

    sourceHeight = this.sourceElementWrapper.getHeight();
    sourceWidth = this.sourceElementWrapper.getWidth();

    this.options.change();

    destinationHeight = this.destinationElementWrapper.getHeight();
    destinationWidth  = this.destinationElementWrapper.getWidth();

    this.outerWrapper = new Element("div");
    this.transitionElement.insert({ before: this.outerWrapper });
    this.outerWrapper.setStyle({ 
      overflow: "hidden", height: sourceHeight + "px", width: sourceWidth + "px"
    }).appendChild(this.transitionElement);

    maxHeight = Math.max(destinationHeight, sourceHeight), maxWidth = Math.max(destinationWidth, sourceWidth);
      
    this.transitionElement.setStyle({ height: sourceHeight + "px", width: sourceWidth + "px" });
    this.sourceElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0 });
    this.destinationElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0, opacity: 0, zIndex: 2000 });

    this.outerWrapper.insert({ before: this.transitionElement }).remove();

    this.animate('style', this.transitionElement, { style: 'height:' + destinationHeight + 'px; width:' + destinationWidth + 'px' });
    this.animate('style', this.destinationElementWrapper, { style: 'opacity: 1.0' });
  },

  teardownWrappers: function() {
    var destinationElement = this.destinationElementWrapper.down();

    if (destinationElement)
      this.transitionElement.insert({ before: destinationElement });

    this.transitionElement.remove();
  }
});