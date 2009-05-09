s2.fx = new (function(){
  var queues = [], globalQueue, heartbeat, activeEffects = 0;
  
  this.beatOnDemand = function(dir){
    heartbeat[(activeEffects += dir) > 0 ? 'start' : 'stop']();
  };
  
  this.renderQueues = function(){
    queues.invoke('render', heartbeat.getTimestamp());
  };
  
  this.getQueues = function(){
    return queues;
  };
  
  this.setHeartbeat = function(newHeartbeat){
    heartbeat = newHeartbeat;
  };
  
  this.getHeartbeat = function(){
    return heartbeat;
  };
  
  this.addQueue = queues.push;
  
  this.initialize = function(initialHeartbeat){
    if(globalQueue) return;
    queues.push(globalQueue = new s2.fx.Queue());
    s2.fx.DefaultOptions.queue = globalQueue;
    heartbeat = initialHeartbeat || new s2.fx.Heartbeat();
  };
  
  document
    .observe('effect:heartbeat', this.renderQueues)
    .observe('effect:queued',    this.beatOnDemand.curry(1))
    .observe('effect:dequeued',  this.beatOnDemand.curry(-1));
})();

Object.extend(s2.fx, {
  DefaultOptions: {
    transition: 'sinusoidal',
    position:   'parallel',
    fps:        60,
    duration:   1
  },
  
  elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  }
});

s2.fx.Base = Class.create({
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
    if (Object.isNumber(options)) options = { duration: options };

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
