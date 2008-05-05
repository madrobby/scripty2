Effect.Queue = Class.create({
  initialize: function() {
    this.effects = [];
  },

  active: function() {
    return this.effects.length > 0;
  },

  add: function(effect) {
    this.calculateTiming(effect);
    this.effects.push(effect);
    document.fire('effect:queued', this);
    return this;
  },

  remove: function(effect) {
    this.effects = this.effects.without(effect);
    delete effect;
    document.fire('effect:dequeued', this);
    return this;
  },

  removeInactiveEffects: function() {
    this.effects.select(function(effect) {
      return effect.state == 'finished';
    }).each(this.remove, this);
  },

  render: function(timestamp) {
    this.effects.invoke('render', timestamp);
    this.removeInactiveEffects();
    return this;
  },

  calculateTiming: function(effect) {
    position = effect.options.position || 'parallel';
    var startsAt = Effect.heartbeat.getTimestamp();

    if (position == 'end')
      startsAt = this.effects.without(effect).pluck('endsAt').max() || startsAt;

    effect.startsAt = 
      startsAt + (effect.options.delay || 0) * 1000;
    effect.endsAt = 
      effect.startsAt + (effect.options.duration || 1) * 1000;
  }
});