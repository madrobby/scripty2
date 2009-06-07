s2.fx.Queue = (function(){ 
  return function(){
    var effects = [];
    
    function getEffects(){
      return effects;
    }
    
    function active(){
      return effects.length > 0;
    }
    
    function add(effect){
      calculateTiming(effect);
      effects.push(effect);
      document.fire('effect:queued', this);
      return this;
    }

    function remove(effect){
      effects = effects.without(effect);
      delete effect;
      document.fire('effect:dequeued', this);
      return this;
    }

    function render(timestamp){
      effects.invoke('render', timestamp);
      effects.select(function(effect) {
        return effect.state == 'finished';
      }).each(remove);
      return this;
    }

    function calculateTiming(effect){
      var position = effect.options.position || 'parallel',
        startsAt = s2.fx.getHeartbeat().getTimestamp();

      if (position == 'end')
        startsAt = effects.without(effect).pluck('endsAt').max() || startsAt;

      effect.startsAt = 
        startsAt + (effect.options.delay || 0) * 1000;
      effect.endsAt = 
        effect.startsAt + (effect.options.duration || 1) * 1000;
    }
    
    Object.extend(this, {
      getEffects: getEffects,
      active: active,
      add: add,
      remove: remove,
      render: render
    });
  }
})();