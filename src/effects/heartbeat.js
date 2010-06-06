/** section: scripty2 fx
 *  class S2.FX.Heartbeat
 *
 *  The heartbeat class provides for effects timing. An instance of this class
 *  is automatically created when the first effect on a page is instantiated.
 *
 *  This class can be extended and replaced by your own implementation:
 *
 *      // call before effects are created
 *      var myHeartbeat = Class.create(S2.FX.Heartbeat, { ... });
 *      S2.FX.initialize(new myHeartbeat());
 *
 *  This can be used to implement customized debugging and more.
**/
S2.FX.Heartbeat = Class.create({
  /**
   *  new S2.FX.Heartbeat([options])
   *  - options (Object): options hash
   *
   *  The following options are available:
   *  * [[framerate]]: set (maximum) framerate for calls to [[S2.FX.beat]]/
  **/
  initialize: function(options) {
    this.options = Object.extend({
      framerate: Prototype.Browser.MobileSafari ? 20 : 60
    }, options);
    this.beat = this.beat.bind(this);
  },

  /**
   *  S2.FX.Heartbeat#start() -> undefined
   *  
   *  This function is called by [[S2.FX]] whenever there's a new active effect queued
   *  and there are no other effects running. This mechanism can be used to prevent
   *  unnecessary timeouts/intervals from being active, as [[S2.FX.Hearbeat.beat]] is only
   *  called when there are active effects that need to be rendered. 
  **/
  start: function() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = 
      setInterval(this.beat, 1000/this.options.framerate);
    this.updateTimestamp();
  },

  /**
   *  S2.FX.Heartbeat#stop() -> undefined
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
   *  S2.FX.Heartbeat#beat() -> undefined
   *  
   *  This method fires an `effect:heartbeat` event which is in turn used by
   *  [[S2.FX]] to render all active effect queues.
   * 
   *  Fires: effect:heartbeat
  **/
  beat: function() {
    this.updateTimestamp();
    document.fire('effect:heartbeat');
  },

  /**
   *  S2.FX.Heartbeat#getTimestamp() -> Date
   *  
   *  Returns the current timestamp.
  **/
  getTimestamp: function() {
    return this.timestamp || this.generateTimestamp();
  },

  /**
   *  S2.FX.Heartbeat#generateTimestamp() -> Date
   *  
   *  Returns the current date and time.
  **/
  generateTimestamp: function() {
    return new Date().getTime();
  },
  
  /**
   *  S2.FX.Heartbeat#updateTimestamp() -> undefined
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