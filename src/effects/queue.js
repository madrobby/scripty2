/**
 *  class S2.FX.Queue
 *
 *  Effect queues manage the execution of effects in parallel or 
 *  end-to-end over time.
**/
S2.FX.Queue = (function(){ 
  return function() {
    var instance = this;
    var effects = [];
    
    /**
     *  S2.FX.Queue#getEffects() -> Array
     *
     *  Returns an array of any effects currently running or queued up.
    **/
    function getEffects() {
      return effects;
    }
    
    /**
     *  S2.FX.Queue#active() -> Boolean
     *
     *  Returns whether there are any effects currently running or queued up.
    **/
    function active() {
      return effects.length > 0;
    }
    
    /**
     *  S2.FX.Queue#add(effect) -> S2.FX.Queue
     *  - effect (S2.FX.Base): Effect to be queued
     *
     *  Add an effect to the queue. The effects' options can optionally
     *  contain a `position` option that can be either `parallel` 
     *  (the effect will start immediately) or `end` (the effect will start
     *  when the last of the currently-queued effects ends).
     *  Returns the Queue.
     *
     *  fires: effect:queued
    **/
    function add(effect) {
      calculateTiming(effect);
      effects.push(effect);
      document.fire('effect:queued', instance);
      return instance;
    }

    /**
     *  S2.FX.Queue#remove(effect) -> S2.FX.Queue
     *  - effect (S2.FX.Base): Effect to be removed from the Queue.
     *
     *  Removes an effect from the Queue and destroys the effect.
     *  Returns the Queue.
     *
     *  fires: effect:dequeued
    **/
    function remove(effect) {
      effects = effects.without(effect);
      document.fire('effect:dequeued', instance);
      delete effect;
      return instance;
    }

    /**
     *  S2.FX.Queue#render(timestamp) -> S2.FX.Queue
     *  - timestamp (Date): Timestamp given to the individual effects' render methods.
     *
     *  Renders all effects that are currently in the Queue.
     *  Returns the Queue.
    **/
    function render(timestamp) {
      for (var i = 0, effect; effect = effects[i]; i++) {
        effect.render(timestamp);
        if (effect.state === 'finished') remove(effect);
      }
      
      return instance;
    }

    function calculateTiming(effect) {
      var position = effect.options.position || 'parallel',
        now = S2.FX.getHeartbeat().getTimestamp();

      var startsAt;
      if (position === 'end') {
        startsAt = effects.without(effect).pluck('endsAt').max() || now;
        if (startsAt < now) startsAt = now;
      } else {
        startsAt = now;
      }
       
      // If the user specified a delay, we convert it to ms and add it to the
      // `startsAt` time. 
      var delay = (effect.options.delay || 0) * 1000;      
      effect.startsAt = startsAt + delay;
      
      var duration = (effect.options.duration || 1) * 1000;      
      effect.endsAt = effect.startsAt + duration;
    }
    
    Object.extend(instance, {
      getEffects: getEffects,
      active: active,
      add: add,
      remove: remove,
      render: render
    });
  }
})();