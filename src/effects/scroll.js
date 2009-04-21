//= require <effects/operators/scroll>

s2.fx.Scroll = Class.create(s2.fx.Element, {
  setup: function() {
    this.animate('scroll', this.element, { scrollTo: this.options.to });
  }
});