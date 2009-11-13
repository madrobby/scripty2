/**
 *  class S2.FX.Parallel < S2.FX.Base
 *
 *  Effect to execute several other effects in parallel.
**/
S2.FX.Parallel = Class.create(S2.FX.Base, {
  initialize: function($super, effects, options) {
    this.effects = effects || [];
    return $super(options || {});
  },

  setup: function() {
    this.effects.invoke('setup');
  },

  update: function(position) {
    this.effects.invoke('update', position);
  }
});