//= require <effects/operators/style>

/**
 * class s2.fx.Morph < s2.fx.Element
 * This is the most important of the built-in element effects,
 * "morphing" DOM elements to a new set of CSS style rules.
 *
 * It's recommended to use the shorthand syntax, for example:
 *
 * <code class="javascript">  
 * $('element_id').morph('width:300px;color:#fff', { duration: .7 });
 * </code>
 *
 **/
s2.fx.Morph = Class.create(s2.fx.Element, {
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