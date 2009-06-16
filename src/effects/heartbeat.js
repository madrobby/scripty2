/** section: scripty2 fx
 *  class s2.fx.Heartbeat
 *
 *  The heartbeat class provides for effects timing. An instance of this class
 *  is automatically created when the first effect on a page is instantiated.
 *
 *  This class can be extended and replaced by your own implementation:
 *
 *      // call before effects are created
 *      var myHeartbeat = Class.create(s2.fx.Heartbeat, { ... });
 *      s2.fx.initialize(new myHeartbeat());
 *
 *  This can be used to implement customized debugging and more.
**/
s2.fx.Heartbeat = Class.create({
  /**
   *  new s2.fx.Heartbeat([options])
   *  - options (Object): options hash
   *
   *  The following options are available:
   *  * [[framerate]]: set (maximum) framerate for calls to [[s2.fx.beat]]/
  **/
  initialize: function(options) {
    this.options = Object.extend({
      framerate: Prototype.Browser.MobileSafari ? 20 : 60
    }, options);
    this.beat = this.beat.bind(this);
  },

  /**
   *  s2.fx.Heartbeat#start() -> undefined
   *  
   *  This function is called by [[s2.fx]] whenever there's a new active effect queued
   *  and there are no other effects running. This mechanism can be used to prevent
   *  unnecessary timeouts/intervals from being active, as [[s2.fx.Hearbeat.beat]] is only
   *  called when there are active effects that need to be rendered. 
  **/
  start: function() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = 
      setInterval(this.beat, 1000/this.options.framerate);
    this.updateTimestamp();
  },

  /**
   *  s2.fx.Heartbeat#stop() -> undefined
   *  
   *  Called when the last active effect is dequeued.
  **/
  stop: function() {
    if (!this.heartbeatInterval) return;
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
    this.timestamp = null;
  },

  /**
   *  s2.fx.Heartbeat#beat() -> undefined
   *  
   *  This method fires an `effect:heartbeat` event which is in turn used by
   *  [[s2.fx]] to render all active effect queues.
   * 
   *  Fires: effect:heartbeat
  **/
  beat: function() {
    this.updateTimestamp();
    document.fire('effect:heartbeat');
  },

  /**
   *  s2.fx.Heartbeat#getTimestamp() -> Date
   *  
   *  Returns the current timestamp.
  **/
  getTimestamp: function() {
    return this.timestamp || this.generateTimestamp();
  },

  /**
   *  s2.fx.Heartbeat#generateTimestamp() -> Date
   *  
   *  Returns the current date and time.
  **/
  generateTimestamp: function() {
    return new Date().getTime();
  },
  
  /**
   *  s2.fx.Heartbeat#updateTimestamp() -> undefined
   *  
   *  Updates the current timestamp (sets it to the current date and time).
   *
   *  If subclassed, this can be used to achieve special effects, for example all effects
   *  could be sped up or slowed down.
  **/
  updateTimestamp: function() {
    this.timestamp = this.generateTimestamp();
  }
});