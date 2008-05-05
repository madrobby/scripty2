Effect.Heartbeat = Class.create({
  initialize: function(options) {
    this.options = Object.extend({
      framerate: Prototype.Browser.MobileSafari ? 20 : 60
    }, options);
    this.beat = this.beat.bind(this);
  },

  start: function() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = 
      setInterval(this.beat, 1000/this.options.framerate);
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