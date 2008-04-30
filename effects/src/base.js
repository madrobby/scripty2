var Effect = {
  initialize: function(heartbeat) {
    if (this.heartbeat) return;

    this.queues = [];
    this.globalQueue = new Effect.Queue();
    this.queues.push(this.globalQueue);
    this.activeEffectCount = 0;
    
    this.setHeartbeat(heartbeat || new Effect.Heartbeat());
    document.observe('effect:heartbeat', this.renderQueues.bind(this));
    
    document.observe('effect:queued', function(){
      Effect.activeEffectCount++;
      if (Effect.activeEffectCount == 1) Effect.heartbeat.start();
    });
      
    document.observe('effect:dequeued', function(){
      Effect.activeEffectCount--;
      if (Effect.activeEffectCount == 0) Effect.heartbeat.stop();
    });
  },
  
  setHeartbeat: function(heartbeat) {
    this.heartbeat = heartbeat; 
  },
    
  renderQueues: function() {
    this.queues.invoke('render', this.heartbeat.getTimestamp());
  }
};