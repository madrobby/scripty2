/** section: Effects
 *  class s2.fx.Style < s2.fx.Element
 *
 *  This effect is similiar to [[s2.fx.Morph]] but doesn't provide any
 *  of the more advanced functionality, like content morphing.
**/
s2.fx.Style = Class.create(s2.fx.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});