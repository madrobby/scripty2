Effect.Base = Class.create({
  initialize: function(options) {
    Effect.initialize();
    this.updateWithoutWrappers = this.update;
    
    this.setOptions(options);
    this.state = 'idle';
    
    $w('after before').each(function(method) {
      this[method] = function(method) {
        method(this);
        return this; 
      }
    }.bind(this));
  },
  
  setOptions: function(options) {
    if (!this.options) this.options = Object.extend({
      transition: options && options.tween ? options.tween : 'sinusoidal',
      queue:      Effect.globalQueue,
      position:   'parallel',
      fps:        600
    }, options);
    
    if (this.options.beforeUpdate || this.options.afterUpdate) {
      this.update = this.updateWithoutWrappers.wrap( function(proceed,position){
        if (this.options.beforeUpdate) this.options.beforeUpdate(this);
        proceed(position);
        if (this.options.afterUpdate) this.options.afterUpdate(this);
      }.bind(this));
    }
    this.options.transition = Object.propertize(this.options.transition, Effect.Transitions);
  },
    
  play: function(options) {
    this.setOptions(options);
    this.frameCount = 0;
    this.options.queue.add(this);
    this.duration = this.endsAt-this.startsAt;
    this.maxFrames = this.options.fps * this.duration / 1000;
    return this;
  },
  
  render: function(timestamp) {
    if (timestamp >= this.startsAt) {
      if (this.state == 'idle') {
        if (this.options.before) this.options.before(this);
        if (this.setup) this.setup();
        this.state = 'running';
      }
      if (timestamp >= this.endsAt) {
        this.update(1);
        if (this.teardown) this.teardown();
        if (this.options.after) this.options.after(this);
        this.state = 'finished';
      } else {
        var position = 1 - (this.endsAt-timestamp) / this.duration;
        var frame = (this.maxFrames * position).floor();
        if (frame > this.frameCount) {
          this.update(this.options.transition(position));
          this.frameCount++;
        }
      }
    }
    return this;
  },
  
  inspect: function() {
    return '#<Effect:' + [this.state, this.startsAt, this.endsAt].inspect() + '>';
  }
});

Effect.Element = Class.create(Effect.Base, {
  initialize: function($super, element, options) {
    this.element = $(element);
    this.operators = [];
    return $super(options);
  },
  
  animate: function() {
    var args = $A(arguments), operator = args.shift().capitalize();
    this.operators.push(new Effect.Operators[operator](args[0], args[1] || {}));
  },
  
  play: function($super, element, options) {
    if (element) this.element = $(element);
    return $super(options);
  },
  
  update: function(position) {
    this.operators.invoke('render', position);
  }
});
