/**
 *  class s2.fx.Style < s2.fx.Element
**/
s2.fx.Style = Class.create(s2.fx.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});