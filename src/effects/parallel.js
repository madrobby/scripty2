/**
 *  class s2.fx.Parallel < s2.fx.Base
 *
 *  Effect to execute several other effects in parallel.
**/
s2.fx.Parallel = Class.create(s2.fx.Base, {
  initialize: function($super, effects, options) {
    this.effects = effects || [];
    return $super(options);
  },

  setup: function() {
    this.effects.invoke('setup');
  },

  update: function(position) {
    this.effects.invoke('update', position);
  }
});