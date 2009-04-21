s2.fx.Queue = (function(){ 
  return function(){
    var effects = [];
    
    this.getEffects = function(){
      return effects;
    };
    
    this.active = function() {
      return effects.length > 0;
    };
    
    this.add = function(effect) {
      this.calculateTiming(effect);
      effects.push(effect);
      document.fire('effect:queued', this);
      return this;
    };

    this.remove = function(effect) {
      effects = effects.without(effect);
      delete effect;
      document.fire('effect:dequeued', this);
      return this;
    };

    this.removeInactiveEffects = function() {
      effects.select(function(effect) {
        return effect.state == 'finished';
      }).each(this.remove, this);
    };

    this.render = function(timestamp) {
      effects.invoke('render', timestamp);
      this.removeInactiveEffects();
      return this;
    };

    this.calculateTiming = function(effect) {
      position = effect.options.position || 'parallel';
      var startsAt = s2.fx.getHeartbeat().getTimestamp();

      if (position == 'end')
        startsAt = effects.without(effect).pluck('endsAt').max() || startsAt;

      effect.startsAt = 
        startsAt + (effect.options.delay || 0) * 1000;
      effect.endsAt = 
        effect.startsAt + (effect.options.duration || 1) * 1000;
    };  
  }
})();