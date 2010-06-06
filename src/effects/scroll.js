//= require "operators/scroll"

/**
 *  class S2.FX.Scroll < S2.FX.Element
 *
 *  Effect for scrolling an elements' contents.
**/
S2.FX.Scroll = Class.create(S2.FX.Element, {
  setup: function() {
    this.animate('scroll', this.element, { scrollTo: this.options.to });
  }
});