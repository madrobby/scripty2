/**
 * ==  scripty2 fx ==
 * The scripty2 effects framework provides for time-based transformations of DOM elements
 * and arbitrary JavaScript objects. This is at the core of scripty2 and presents a refinement
 * of the visual effects framework of script.aculo.us 1.
 *
 * In practice [[S2.FX.Morph]] is most often used, which allows transitions from one
 * set of CSS style rules to another.
 *
 * <h2>Features</h2>
 *
 * * <a href="scripty2%20fx/element.html#morph-class_method">CSS morphing engine</a>: 
 *   morph from one set of style properties to another, including
 *   support for all CSS length types (px, em, %, cm, pt, etc.)
 * * <a href="scripty2%20fx/s2/fx/transitions.html">Extensive transition system</a>
 *   for animation easing and special effects (e.g. bouncing)
 * * On supported browsers, uses browser-native visual effects (CSS Transitions),
 *   fully automatically with no change to your code required
 * * Auto-adjusts to differences in computing and rendering speed (drops frames as necessary)
 * * Limits the number of attempted frame renders to conserve CPU in fast computers
 * * Flexible OOP-based implementation allows for easy extension and hacks
 * * <a href="scripty2%20fx/s2/fx/queue.html">Effect queuing</a> to run an effect after other effects have finished
 * * <a href="scripty2%20fx/element.html#morph-class_method">Chaining</a> and 
 *   <a href="scripty2%20fx/s2/fx/base.html#new-constructor">default options</a>: 
 *   easy-to-use syntax for most use cases
 * * <a href="scripty2%20fx/s2/fx/element.html#play-instance_method">Reusable effect instances</a>
 *   can be used with more than one DOM element
 * * User-definable callback functions at any point in the effect lifecycle
 * * Effects are abortable (either as-is or abort-to-end)
**/

/** section: scripty2 fx
 * S2.FX
 * This is the main effects namespace.
**/
S2.FX = (function(){
  var queues = [], globalQueue, 
    heartbeat, activeEffects = 0;
  
  function beatOnDemand(dir) {
    activeEffects += dir;
    if (activeEffects > 0) heartbeat.start();
    else heartbeat.stop();
  }
  
  function renderQueues() {
    var timestamp = heartbeat.getTimestamp();
    for (var i = 0, queue; queue = queues[i]; i++) {
      queue.render(timestamp);
    }
  }
  
  function initialize(initialHeartbeat){
    if (globalQueue) return;
    queues.push(globalQueue = new S2.FX.Queue());
    S2.FX.DefaultOptions.queue = globalQueue;
    heartbeat = initialHeartbeat || new S2.FX.Heartbeat();
    
    document
      .observe('effect:heartbeat', renderQueues)
      .observe('effect:queued',    beatOnDemand.curry(1))
      .observe('effect:dequeued',  beatOnDemand.curry(-1));
  }
  
  function formatTimestamp(timestamp) {
    if (!timestamp) timestamp = (new Date()).valueOf();
    var d = new Date(timestamp);
    return d.getSeconds() + '.' + d.getMilliseconds() + 's';
  }
  
  return {
    initialize:   initialize,
    getQueues:    function() { return queues; },
    addQueue:     function(queue) { queues.push(queue); },
    getHeartbeat: function() { return heartbeat; },
    setHeartbeat: function(newHeartbeat) { heartbeat = newHeartbeat; },
    formatTimestamp: formatTimestamp
  }
})();

Object.extend(S2.FX, {
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
      
    return options || {};
  },
  
  ready: function(element) {
    if (!element) return;
    var table = this._ready;
    var uid = element._prototypeUID;
    if (!uid) return true;
    
    bool = table[uid];
    return Object.isUndefined(bool) ? true : bool;
  },
  
  setReady: function(element, bool) {
    if (!element) return;
    var table = this._ready, uid = element._prototypeUID;
    if (!uid) {
      element.getStorage();
      uid = element._prototypeUID;
    }
    
    table[uid] = bool;
  },
  
  _ready: {}
});

/**
 *  class S2.FX.Base
**/
S2.FX.Base = Class.create({
  /**
   *  new S2.FX.Base([options])
   *  - options (Number | Function | Object): options for the effect.
   *
   *  Base calls for all effects. Subclasses need to define the `update` instance
   *  method for it to be useful. scripty2 currently provides one subclass implementation
   *  for effects based on DOM elements, [[S2.FX.Element]].
   *
   *  <h4>Effect options</h4>
   *  
   *  There are serveral ways the options argument can be used:
   *      
   *      new S2.FX.Base({ duration: 3, transition: 'spring' });
   *      new S2.FX.Base(function(){})   // shortcut for { after: function(){} }
   *      new S2.FX.Base(3);             // shortcut for { duration: 3 }
   *      new S2.FX.Base('slow');        // shortcut for { duration: 1 }
   *      new S2.FX.Base('fast');        // shortcut for { duration: .1 }
   *
   *  The following options are recognized:
   *
   *  * `duration`: duration in seconds, defaults to 0.2 (a fifth of a second). This
   *     speed is based on the value Mac OS X uses for interface effects.
   *  * `transition`: Function reference or String with a property name from [[S2.FX.Transitions]].
   *    Sets the transition method for easing and other special effects.
   *  * `before`: Function to be executed before the first frame of the effect is rendered.
   *  * `after`: Function to be executed after the effect has finished.
   *  * `beforeUpdate`: Function to be executed before each frame is rendered. This function
   *    is given two parameters: the effect instance and the current position (between 0 and 1).
   *  * `afterUpdate`: Function to be executed after each frame is renedred. This function
   *    is given two parameters: the effect instance and the current position (between 0 and 1).
   *  * `fps`: The maximum number of frames per second. Ensures that no more than `options.fps`
   *    frames per second are rendered, even if there's enough computation resources available.
   *    This can be used to make CPU-intensive effects use fewer resources.
   *  * `queue`: Specify a [[S2.FX.Queue]] to be used for the effect.
   *  * `position`: Position within the specified queue, `parallel` (start immediately, default) or `end` 
   *    (queue up until the last effect in the queue is finished)
   *
   *  The effect won't start immediately, it will merely be initialized.
   *  To start the effect, call [[S2.FX.Base#play]].
  **/
  initialize: function(options) {
    S2.FX.initialize();
    this.updateWithoutWrappers = this.update;

    if(options && options.queue && !S2.FX.getQueues().include(options.queue))
      S2.FX.addQueue(options.queue);

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
    options = S2.FX.parseOptions(options);

    this.options = Object.extend(this.options || Object.extend({}, S2.FX.DefaultOptions), options);
    
    if (options.tween) this.options.transition = options.tween;
  
    if (this.options.beforeUpdate || this.options.afterUpdate) {
      this.update = this.updateWithoutWrappers.wrap( function(proceed,position){
        if (this.options.beforeUpdate) this.options.beforeUpdate(this, position);
        proceed(position);
        if (this.options.afterUpdate) this.options.afterUpdate(this, position);
      }.bind(this));
    }

    if (this.options.transition === false)
      this.options.transition = S2.FX.Transitions.linear;

    this.options.transition = Object.propertize(this.options.transition, S2.FX.Transitions);
  },

  /**
   *  S2.FX.Base#play([options]) -> S2.FX.Base
   *  - options: Effect options, see above.
   *
   *  Starts playing the effect.
   *  Returns the effect.
  **/
  play: function(options) {
    this.setOptions(options);
    this.frameCount = 0;
    this.state = 'idle';
    this.options.queue.add(this);
    this.maxFrames = this.options.fps * this.duration / 1000;
    return this;
  },

  /**
   *  S2.FX.Base#render(timestamp) -> undefined
   *  - timestamp (Date): point in time, normally the current time
   *
   *  Renders the effect, and calls the before/after functions when necessary.
   *  This method also switches the state of the effect from `idle` to `running` when
   *  the first frame is rendered, and from `running` to `finished` after the last frame
   *  is rendered. 
  **/
  render: function(timestamp) {
    if (this.options.debug) {
      // this.debug("render called at " + S2.FX.formatTimestamp(timestamp));
    }
    if (timestamp >= this.startsAt) {
      // Effect should be active.
      if (this.state == 'idle' && S2.FX.ready(this.element)) {
        // The element is ready for a new effect, but this effect hasn't yet
        // been started. Start it now.
        this.debug('starting the effect at ' + S2.FX.formatTimestamp(timestamp));
        // Reschedule the end time in case we're running behind schedule.
        this.endsAt = this.startsAt + this.duration;
        this.start();
        this.frameCount++;
        return this;
      }
      
      if (timestamp >= this.endsAt && this.state !== 'finished') {
        // The effect has exceeded its scheduled time but has not yet been
        // stopped yet. Stop it now.
        this.debug('stopping the effect at ' + S2.FX.formatTimestamp(timestamp));
        this.finish();
        return this;
      }
      
      if (this.state === 'running') {
        // The effect is running. Figure out its new tweening coefficient
        // and update the animation.
        var position = 1 - (this.endsAt - timestamp) / this.duration;
        if ((this.maxFrames * position).floor() > this.frameCount) {
          this.update(this.options.transition(position));
          this.frameCount++;
        }
      }
    }
    return this;
  },
  
  start: function() {
    if (this.options.before) this.options.before(this);
    if (this.setup) this.setup();
    this.state = 'running';
    this.update(this.options.transition(0));
  },
  
  /**
   *  S2.FX.Base#cancel([after]) -> undefined
   *  - after (Boolean): if true, run the after method (if defined), defaults to false
   *
   *  Calling `cancel()` immediately halts execution of the effect, and calls the `teardown`
   *  method if defined. 
  **/
  cancel: function(after) {
    if (this.state !== 'running') return;
    if (this.teardown) this.teardown();
    if (after && this.options.after) this.options.after(this);
    this.state = 'finished';
  },

  /**
   *  S2.FX.Base#finish() -> undefined
   *
   *  Immediately render the last frame and halt execution of the effect
   *  and call the `teardown`method if defined.
  **/
  finish: function() {
    if (this.state !== 'running') return;
    this.update(this.options.transition(1));
    this.cancel(true);
  },

  /**
   *  S2.FX.Base#inspect() -> String
   *
   *  Returns the debug-oriented string representation of an effect.
  **/
  inspect: function() {
    return '#<S2.FX:' + [this.state, this.startsAt, this.endsAt].inspect() + '>';
  },
  
  /**
   *  S2.FX.Base#update() -> undefined
   *
   *  The update method is called for each frame to be rendered. The implementation
   *  in `S2.FX.Base` simply does nothing, and is intended to be overwritten by
   *  subclasses. It is provided for cases where `S2.FX.Base` is instantiated directly
   *  for ad-hoc effects using the beforeUpdate and afterUpdate callbacks.
  **/
  update: Prototype.emptyFunction,
  
  debug: function(message) {
    if (!this.options.debug) return;
    if (window.console && console.log) {
      console.log(message);
    }
  }
});

/**
 * class S2.FX.Element < S2.FX.Base
 * Base class for effects that change DOM elements. This is the base class for
 * the most important effects implementation [[S2.FX.Morph]], but can be used
 * as a base class for non-CSS based effects too.
**/
S2.FX.Element = Class.create(S2.FX.Base, {
  /**
   *  new S2.FX.Element(element[, options])
   *  - element (Object | String): DOM element or element ID
   *  - options (Number | Function | Object): options for the effect.
   *
   *  See [[S2.FX.Base]] for a description of the `options` argument.
  **/
  initialize: function($super, element, options) {
    if(!(this.element = $(element)))
      throw(S2.FX.elementDoesNotExistError);
    this.operators = [];
    return $super(options);
  },

  /**
   *  S2.FX.Element#animate(operator[, args...]) -> undefined
   *  - operator (String): lowercase name of an [[S2.FX.Operator]]
   *
   *  Starts an animation by using a [[S2.FX.Operator]] on the element
   *  that is associated with the effect.
   *  
   *  The rest of the arguments are passed to Operators' constructor.
   *  This method is intended to be called in the `setup` instance method
   *  of subclasses, for example:
   *
   *      // setup method from S2.FX.Style
   *      setup: function() {
   *        this.animate('style', this.element, { style: this.options.style }); 
   *      }
  **/
  animate: function() {
    var args = $A(arguments), operator =  args.shift();
    operator = operator.charAt(0).toUpperCase() + operator.substring(1);
    this.operators.push(new S2.FX.Operators[operator](this, args[0], args[1] || {}));
  },

  /**
   *  S2.FX.Element#play([element[, options]]) -> S2.FX.Base
   *  - element (Object | String): DOM element or element ID
   *  - options (Number | Function | Object): options for the effect.
   *
   *  Starts playing the element effect. The optional `element` argument can
   *  be used to reuse this instance on a different element than for
   *  which it was used originally.
  **/
  play: function($super, element, options) {
    if (element) this.element = $(element);
    this.operators = [];
    return $super(options);
  },

  update: function(position) {
    for (var i = 0, operator; operator = this.operators[i]; i++) {
      operator.render(position);
    }
  }
});
