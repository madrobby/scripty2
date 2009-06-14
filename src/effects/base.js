/**
 * == Effects ==
 * The scripty2 effects framework provides for time-based transformations of DOM elements 
 * and arbitrary JavaScript objects. This is at the core of scripty2 and presents a refinement 
 * of the visual effects framework of script.aculo.us 1.X.
 *
 * In practice `s2.fx.Morph` is most often used, which allows transitions from one
 * set of CSS style rules to another.
**/

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

/**
 *  class s2.fx.Base
**/
s2.fx.Base = Class.create({
  /**
   *  new s2.fx.Base([options])
   *  - options (Number | Function | Object): options for the effect.
   *
   *  Base calls for all effects. Subclasses need to define the `update` instance
   *  method for it to be useful. scripty2 currently provides one subclass implementation
   *  for effects based on DOM elements, [[s2.fx.Element]].
   *
   *  <h4>Effect options</h4>
   *  
   *  There are serveral ways the options argument can be used:
   *      
   *      new s2.fx.Base({ duration: 3, transition: 'spring' });
   *      new s2.fx.Base(function(){})   // shortcut for { after: function(){} }
   *      new s2.fx.Base(3);             // shortcut for { duration: 3 }
   *      new s2.fx.Base('slow');        // shortcut for { duration: 1 }
   *      new s2.fx.Base('fast');        // shortcut for { duration: .1 }
   *
   *  The following options are recognized:
   *
   *  * `duration`: duration in seconds, defaults to 0.2 (a fifth of a second). This
   *     speed is based on the value Mac OS X uses for interface effects.
   *  * `transition`: Function reference or String with a property name from [[s2.fx.Transitions]].
   *    Sets the transition method for easing and other special effects.
   *  * `before`: Function to be executed before the first frame of the effect is rendered.
   *  * `after`: Function to be executed after the effect has finished.
   *  * `beforeUpdate`: Function to be executed before each frame is rendered.
   *  * `afterUpdate`: Function to be executed after each frame is renedred.
   *  * `fps`: The maximum number of frames per second. Ensures that no more than `options.fps`
   *    frames per second are rendered, even if there's enough computation resources available.
   *    This can be used to make CPU-intensive effects use fewer resources.
   *  * `queue`: Specify a [[s2.fx.Queue]] to be used for the effect.
   *
   *  The effect won't start immediately, it will merely be initialized.
   *  To start the effect, call [[s2.fx.Base#play]].
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

  /**
   *  s2.fx.Base#play([options]) -> s2.fx.Base
   *  - options: Effect options, see above.
   *
   *  Starts playing the effect.
   *  Returns the effect.
  **/
  play: function(options) {
    this.setOptions(options);
    this.frameCount = 0;
    this.options.queue.add(this);
    this.maxFrames = this.options.fps * this.duration / 1000;
    return this;
  },

  /**
   *  s2.fx.Base#render(timestamp) -> undefined
   *  - timestamp (Date): point in time, normally the current time
   *
   *  Renders the effect, and calls the before/after functions when necessary.
   *  This method also switches the state of the effect from `idle` to `running` when
   *  the first frame is rendered, and from `running` to `finished` after the last frame
   *  is rendered. 
  **/
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
  
  /**
   *  s2.fx.Base#cancel([after]) -> undefined
   *  - after (Boolean): if true, run the after method (if defined), defaults to false
   *
   *  Calling `cancel()` immediately halts execution of the effect, and calls the `teardown`
   *  method if defined. 
  **/
  cancel: function(after) {
    if(!this.state == 'running') return;
    if (this.teardown) this.teardown();
    if (after && this.options.after) this.options.after(this);
    this.state = 'finished';
  },

  /**
   *  s2.fx.Base#inspect() -> String
   *
   *  Returns the debug-oriented string representation of an effect.
  **/
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
  /**
   *  new s2.fx.Element(element[, options])
   *  - element (Object | String): DOM element or element ID
   *  - options (Number | Function | Object): options for the effect.
   *
   *  See [[s2.fx.Base]] for a description of the `options` argument.
  **/
  initialize: function($super, element, options) {
    if(!(this.element = $(element)))
      throw(s2.fx.elementDoesNotExistError);
    this.operators = [];
    return $super(options);
  },

  /**
   *  s2.fx.Element#animate(operator[, args...]) -> undefined
   *  - operator (String): lowercase name of an [[s2.fx.Operator]]
   *
   *  Starts an animation by using a [[s2.fx.Operator]] on the element
   *  that is associated with the effect.
   *  
   *  The rest of the arguments are passed to Operators' constructor.
   *  This method is intended to be called in the `setup` instance method
   *  of subclasses, for example:
   *
   *      // setup method from s2.fx.Style
   *      setup: function() {
   *        this.animate('style', this.element, { style: this.options.style }); 
   *      }
  **/
  animate: function() {
    var args = $A(arguments), operator =  args.shift();
    operator = operator.charAt(0).toUpperCase() + operator.substring(1);
    this.operators.push(new s2.fx.Operators[operator](this, args[0], args[1] || {}));
  },

  /**
   *  s2.fx.Element#play([element[, options]]) -> s2.fx.Base
   *  - element (Object | String): DOM element or element ID
   *  - options (Number | Function | Object): options for the effect.
   *
   *  Starts playing the element effect. The optional `element` argument can
   *  be used to reuse this instance on a different element than for
   *  which it was used originally.
  **/
  play: function($super, element, options) {
    if (element) this.element = $(element);
    return $super(options);
  },

  update: function(position) {
    this.operators.invoke('render', position);
  }
});
