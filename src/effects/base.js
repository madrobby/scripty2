/** section: Effects
 * s2.fx
 * This is the main effects namespace.
 **/
s2.fx = (function(){
  var queues = [], globalQueue, 
    heartbeat, activeEffects = 0;
  
  function beatOnDemand(dir){
    heartbeat[(activeEffects += dir) > 0 ? 'start' : 'stop']();
  }
  
  function renderQueues(){
    queues.invoke('render', heartbeat.getTimestamp());
  }
  
  function initialize(initialHeartbeat){
    if(globalQueue) return;
    queues.push(globalQueue = new s2.fx.Queue());
    s2.fx.DefaultOptions.queue = globalQueue;
    heartbeat = initialHeartbeat || new s2.fx.Heartbeat();
    
    document
      .observe('effect:heartbeat', renderQueues)
      .observe('effect:queued',    beatOnDemand.curry(1))
      .observe('effect:dequeued',  beatOnDemand.curry(-1));
  }
  
  return {
    initialize: initialize,
    getQueues: function(){ return queues; },
    addQueue: queues.push,
    getHeartbeat: function(){ return heartbeat; },
    setHeartbeat: function(newHeartbeat){ 
      heartbeat = newHeartbeat; 
    }    
  }
})();

Object.extend(s2.fx, {
  DefaultOptions: {
    transition: 'sinusoidal',
    position:   'parallel',
    fps:        60,
    duration:   .2
  },
  
  elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },
  
  parseOptions: function(options) {
    if (Object.isNumber(options)) 
      options = { duration: options };
    else if (Object.isFunction(options))
      options = { after: options };
    else if (Object.isString(options))
      options = { duration: options == 'slow' ? 1 : options == 'fast' ? .1 : .2 };
      
    return options;
  }
});

/** section: Effects
 *  class s2.fx.Base
 **/
s2.fx.Base = Class.create({
  /**
   *  new s2.fx.Base([options])
   *  - options (Object): options for the effect expressed in property/value pairs
   *
   * Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor 
   * incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
   * exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
   * irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla 
   * pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
   * deserunt mollit anim id est laborum.
   **/
  initialize: function(options) {
    s2.fx.initialize();
    this.updateWithoutWrappers = this.update;

    if(options && options.queue && !s2.fx.getQueues().include(options.queue))
      s2.fx.addQueue(options.queue);

    this.setOptions(options);
    this.duration = this.options.duration*1000;
    this.state = 'idle';

    ['after','before'].each(function(method) {
      this[method] = function(method) {
        method(this);
        return this; 
      }
    }, this);
  },

  setOptions: function(options) {
    options = s2.fx.parseOptions(options);

    if (!this.options) {
      this.options = Object.extend(Object.extend({},s2.fx.DefaultOptions), options);
      if(options.tween) this.options.transition = options.tween;
    }
    
    if (this.options.beforeUpdate || this.options.afterUpdate) {
      this.update = this.updateWithoutWrappers.wrap( function(proceed,position){
        if (this.options.beforeUpdate) this.options.beforeUpdate(this);
        proceed(position);
        if (this.options.afterUpdate) this.options.afterUpdate(this);
      }.bind(this));
    }
    if(this.options.transition === false)
      this.options.transition = s2.fx.Transitions.linear;
    this.options.transition = Object.propertize(this.options.transition, s2.fx.Transitions);
  },

  play: function(options) {
    this.setOptions(options);
    this.frameCount = 0;
    this.options.queue.add(this);
    this.maxFrames = this.options.fps * this.duration / 1000;
    return this;
  },

  render: function(timestamp) {
    if (timestamp >= this.startsAt) {
      if (this.state == 'idle') {
        if (this.options.before) this.options.before(this);
        if (this.setup) this.setup();
        this.state = 'running';
        this.update(this.options.transition(0));
        this.frameCount++;
        return this;
      }
      if (timestamp >= this.endsAt) {
        this.update(this.options.transition(1));
        if (this.teardown) this.teardown();
        if (this.options.after) this.options.after(this);
        this.state = 'finished';
      } else {
        var position = 1 - (this.endsAt - timestamp) / this.duration;
        if ((this.maxFrames * position).floor() > this.frameCount) {
          this.update(this.options.transition(position));
          this.frameCount++;
        }
      }
    }
    return this;
  },

  inspect: function() {
    return '#<s2.fx:' + [this.state, this.startsAt, this.endsAt].inspect() + '>';
  }
});

/**
 * class s2.fx.Element < s2.fx.Base
 * Base class for effects that change DOM elements. This is the base class for
 * the most important effects implementation [[s2.fx.Morph]], but can be used
 * as a base class for non-CSS based effects too.
 **/
s2.fx.Element = Class.create(s2.fx.Base, {
  initialize: function($super, element, options) {
    if(!(this.element = $(element)))
      throw(s2.fx.elementDoesNotExistError);
    this.operators = [];
    return $super(options);
  },

  animate: function() {
    var args = $A(arguments), operator =  args.shift();
    operator = operator.charAt(0).toUpperCase() + operator.substring(1);
    this.operators.push(new s2.fx.Operators[operator](this, args[0], args[1] || {}));
  },

  play: function($super, element, options) {
    if (element) this.element = $(element);
    return $super(options);
  },

  update: function(position) {
    this.operators.invoke('render', position);
  }
});
