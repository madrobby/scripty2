//= require <effects/operators/scroll>

/** section: Effects
 *  class s2.fx.Scroll < s2.fx.Element
 *
 *  Effect for scrolling an elements' contents.
**/
s2.fx.Scroll = Class.create(s2.fx.Element, {
  setup: function() {
    this.animate('scroll', this.element, { scrollTo: this.options.to });
  }
});