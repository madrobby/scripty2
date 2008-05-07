var Effect = {
  initialize: function(heartbeat) {
    if (this.heartbeat) return;

    this.queues = [];
    this.globalQueue = new Effect.Queue();
    this.queues.push(this.globalQueue);

    this.heartbeat = heartbeat || new Effect.Heartbeat();
    this.activeEffectCount = 0;

    document
      .observe('effect:heartbeat', this.renderQueues.bind(this))
      .observe('effect:queued',    this.beatOnDemand.bind(this, 1))
      .observe('effect:dequeued',  this.beatOnDemand.bind(this, -1));
  },

  beatOnDemand: function(dir) {
    this.heartbeat[(this.activeEffectCount += dir) > 0 ? 'start' : 'stop']();
  },

  renderQueues: function() {
    this.queues.invoke('render', this.heartbeat.getTimestamp());
  }
};