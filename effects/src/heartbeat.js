Effect.Heartbeat = Class.create({
  initialize: function(options) {
    this.options = Object.extend({
      framerate: 60
    }, options);
  },
  
  start: function() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = 
      setInterval(this.beat.bind(this), 1000/this.options.framerate);
    this.updateTimestamp();
  },
  
  stop: function() {
    if (!this.heartbeatInterval) return;
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
    this.timestamp = null;
  },
  
  beat: function() {
    this.updateTimestamp();
    document.fire('effect:heartbeat');
  },
  
  getTimestamp: function() {
    return this.timestamp || this.generateTimestamp();
  },
  
  generateTimestamp: function() {
    return new Date().getTime();
  },
  
  updateTimestamp: function() {
    this.timestamp = this.generateTimestamp();
  }
});