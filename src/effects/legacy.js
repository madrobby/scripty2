s2.fx.Opacity = Class.create(s2.fx.Element, {
  setup: function() {
    var from = this.options.from || 0, to = this.options.to || 1;
    this.element.setStyle('opacity:'+from);
    this.animate('style', this.element, { style: 'opacity:'+to });
  }
});