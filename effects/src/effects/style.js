Effect.Style = Class.create(Effect.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});