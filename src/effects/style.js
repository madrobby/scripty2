/**
 *  class S2.FX.Style < S2.FX.Element
 *
 *  This effect is similiar to [[S2.FX.Morph]] but doesn't provide any
 *  of the more advanced functionality, like content morphing.
**/
S2.FX.Style = Class.create(S2.FX.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});