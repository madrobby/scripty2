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

Effect.Queue = Class.create({
  initialize: function() {
    this.effects = [];
  },
  
  active: function() {
    return this.effects.length > 0;
  },
  
  add: function(effect) {
    this.calculateTiming(effect);
    this.effects.push(effect);
    document.fire('effect:queued', this);
    return this;
  },
  
  remove: function(effect) {
    this.effects = this.effects.without(effect);
    delete effect;
    document.fire('effect:dequeued', this);
    return this;
  },
  
  removeInactiveEffects: function() {
    this.effects.select(function(effect) {
      return effect.state == 'finished';
    }).each(this.remove.bind(this));
  },
  
  render: function(timestamp) {
    this.effects.invoke('render', timestamp);
    this.removeInactiveEffects();
    return this;
  },
  
  calculateTiming: function(effect) {
    position = effect.options.position || 'parallel';
    var startsAt = Effect.heartbeat.getTimestamp();
    
    if (position == 'end')
      startsAt = this.effects.without(effect).pluck('endsAt').max() || startsAt;
    
    effect.startsAt = 
      startsAt + (effect.options.delay || 0) * 1000;
    effect.endsAt = 
      effect.startsAt + (effect.options.duration || 1) * 1000;
  }
});

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

Function.prototype.optionize = function(){
  var self = this, argumentNames = self.argumentNames(), optionIndex = argumentNames.length - 1;
  var method = function(){
    var args = $A(arguments), options = typeof args.last() == 'object' ? args.pop() : {},
      prefilledArgs = (optionIndex == 0 ? [] : 
        ((args.length > 0 ? args : [null]).inGroupsOf(optionIndex).flatten())).concat(options);
    return self.apply(this, prefilledArgs);
  };
  method.argumentNames = function(){ return argumentNames };
  return method;
};

Number.prototype.tween = function(target, position){
  return this + (target-this) * position;
};

Object.propertize = function(property, object){
  return Object.isString(property) ? object[property] : property;
};

var CSS = {
  PROPERTIES: $w(
    'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' + 
    'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
    'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
    'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
    'fontSize fontWeight height left letterSpacing lineHeight ' +
    'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
    'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
    'right textIndent top width wordSpacing zIndex'),
  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,
  
  __parseStyleElement: document.createElement('div'),
  parseStyle: function(styleString) {
    CSS.__parseStyleElement.innerHTML = '<div style="' + styleString + '"></div>';
    var style = CSS.__parseStyleElement.childNodes[0].style, styleRules = {};

    CSS.NUMERIC_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = style[property]; 
    });
    
    CSS.COLOR_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = CSS.Color.fromString(style[property]);
    });

    if (Prototype.Browser.IE && styleString.include('opacity'))
      styleRules.opacity = styleString.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1];
    
    return styleRules;
  },
   
  Color: {
    normalize: function(color) {
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = CSS.Color.fromString(color);
      return [0,1,2].map(function(i){ return parseInt(color.slice(i*2+1,i*2+3), 16) });
    },
    
    fromString: function(color) {  
      var value = '#';
      if (color.slice(0,4) == 'rgb(') {  
        var cols = color.slice(4,color.length-1).split(',');  
        var i=0; do { value += parseInt(cols[i]).toColorPart() } while (++i<3);  
      } else {  
        if (color.slice(0,1) == '#') {  
          if (color.length==4) for(var i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();  
          if (color.length==7) value = color.toLowerCase();  
        } 
      }  
      return (value.length==7 ? value : (arguments[1] || value));  
    }    
  },
  
  ElementMethods: {
    getStyles: function(element) {
      var css = document.defaultView.getComputedStyle($(element), null);
      return CSS.PROPERTIES.inject({ }, function(styles, property) {
        styles[property] = css[property];
        return styles;
      });
    }
  }
};

CSS.NUMERIC_PROPERTIES = CSS.PROPERTIES.findAll(function(property){ return !property.endsWith('olor') });
CSS.COLOR_PROPERTIES   = CSS.PROPERTIES.findAll(function(property){ return property.endsWith('olor') });

if (!(document.defaultView && document.defaultView.getComputedStyle)) {
  CSS.ElementMethods.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = CSS.PROPERTIES.inject({ }, function(hash, property) {
      hash[property] = css[property];
      return hash;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
};

Element.addMethods(CSS.ElementMethods);

Effect.Helpers = { 
  fitIntoRectangle: function(w,h,rw,rh){
    var f = w/h, rf = rw/rh; return f < rf ? 
    [(rw - (w*(rh/h)))/2, 0, w*(rh/h), rh] : 
    [0, (rh - (h*(rw/w)))/2, rw, h*(rw/w)];
  },
  
  viewportOverlay: function(){
    var viewport = document.viewport.getDimensions();
    var offsets = document.viewport.getScrollOffsets();
    return new Element('div').setStyle({
      position: 'absolute',
      left: offsets.left + 'px', top: offsets.top + 'px',
      width: viewport.width + 'px', height: viewport.height + 'px'
    });
  }
};



Effect.ElementMethods = {
  effect: function(element, effect, options){
    if (Object.isFunction(effect))
      effect = new effect(element, options);
    else if (Object.isString(effect)) 
      effect = new Effect[effect.capitalize()](element, options);
    effect.play(element, options);
    return element;
  },
  
  morph: function(element, style, options){
    return element.effect('morph', Object.extend(options, {style: style}));
  }.optionize(),
  
  appear: function(element, options){
    return element.effect('morph', Object.extend({
      before: function(){ element.show().setStyle({opacity:0}) },
      style:  'opacity:1'
    }, options));
  },
  
  fade: function(element, options){
    return element.effect(Effect.Morph, Object.extend({
      style: 'opacity:0',
      after: element.hide.bind(element)
    }, options));
  },
  
  cloneWithoutIDs: function(element) {
    element = $(element);
    var clone = element.cloneNode(true);
    clone.id = "";
    clone.getElementsBySelector("*[id]").each(function(e) { e.id = "" });
    return clone;
  }
};

Element.addMethods(Effect.ElementMethods);

Effect.Operators = { };

Effect.Operators.Base = Class.create({
  initialize: function(object, options) {
    this.object = object;
    this.options = Object.extend({
      transition: Prototype.K
    }, options);
  },
  
  inspect: function() {
    return "#<Effect.Operators.Base:" + this.lastValue + ">";
  },
  
  render: function(position) {
    var value = this.valueAt(this.options.transition(position));
    this.applyValue(value);
    this.lastValue = value;
  }
});

Effect.Operators.Style = Class.create(Effect.Operators.Base, {
  initialize: function($super, object, options) {
    $super(object, options);
    this.element = $(this.object);
    
    if (!this.options.propertyTransitions)
      this.options.propertyTransitions = { }
    else
      for (property in this.options.propertyTransitions)
        this.options.propertyTransitions[property] =
          Object.propertize(this.options.propertyTransitions[property], Effect.Transitions);
    
    if (!Object.isString(this.options.style)) {
      this.style = $H(this.options.style);

    } else {
      if (this.options.style.include(':')) {
        this.style = $H(CSS.parseStyle(this.options.style));
        
      } else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) { return style.value == css[style.key] });
      }
    }
        
    this.tweens = this.style.map(function(pair) {
      var property = pair[0].camelize(), target = pair[1], unit = '', tween, 
        source = this.element.getStyle(property);
        
      if (CSS.COLOR_PROPERTIES.include(property)) {
        if (source == target) return;
        source = CSS.Color.normalize(source);
        target = CSS.Color.normalize(target); unit = 'color';    
        tween = function(currentStyle, style, position) {
          position = (this.options.propertyTransitions[property] || Effect.Transitions.linear)(position);
          var value = '#' + [0,1,2].map(function(index){ 
            return source[index].tween(target[index], position).round().toColorPart();
          }).join('');
          if (currentStyle[property] != value) style[property] = value;
        }.bind(this);
      } else {
        if (CSS.LENGTH.test(target)) {
          var components = target.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          target = components[1];
          unit = String.interpret((components.length == 3) ? components[2] : null);
        }
        source = parseFloat(source); target = parseFloat(target); 
        if (isNaN(source) || isNaN(target) || source == target) return;
        tween = function(currentStyle, style, position) {
          position = (this.options.propertyTransitions[property] || Effect.Transitions.linear)(position);
          var value = source.tween(target, position)[unit == 'px' ? 'round' : 'toFixed'](3) + unit;
          if (currentStyle[property] != value) style[property] = value;
        }.bind(this);
      }
      return tween;
    }.bind(this)).compact();
  },
  
  valueAt: function(position) {
    var style = { }, currentStyle = this.currentStyle || { };
    this.tweens.each( function(tween){ 
      tween(currentStyle, style, position) 
    });
    return style;
  },
  
  applyValue: function(value) {
    this.element.setStyle(value);
    this.currentStyle = value;
  }
});

Effect.Operators.Scroll = Class.create(Effect.Operators.Base, {
  initialize: function($super, object, options) {
    $super(object, options);
    this.start = object.scrollTop;
    this.end = this.options.scrollTo;
  },
  valueAt: function(position) {
    return this.start + ((this.end - this.start)*position);
  },
  applyValue: function(value){
    this.object.scrollTop = value.round();
  }
});

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
      transition: Effect.Transitions.sinusoidal,
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


Effect.Attribute = Class.create(Effect.Base, {
  initialize: function($super, object, from, to, options, method) {
    object = Object.isString(object) ? $(object) : object;
    
    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) : 
      function(value) { object[method] = value };
      
    this.to = to;
    this.from = from;
    
    return $super(options);
  },
  
  update: function(position) {
    this.method(this.from.tween(this.to, position));
  }
});

Effect.Style = Class.create(Effect.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});

Effect.Morph = Class.create(Effect.Element, {
  setup: function() {
    if (this.options.change) 
      this.setupWrappers();
    else if (this.options.style)
      this.animate('style', this.destinationElement || this.element, { 
        style: this.options.style,
        propertyTransitions: this.options.propertyTransitions || { }
      });
  },
  
  teardown: function() {
    if (this.options.change) 
      this.teardownWrappers();
  },
  
  setupWrappers: function() {
    var elementFloat = this.element.getStyle("float");
    this.transitionElement = new Element('div').setStyle({ position: "relative", overflow: "hidden", 'float': elementFloat });
    this.element.setStyle({ 'float': "none" }).insert({ before: this.transitionElement });

    this.sourceElementWrapper = this.element.cloneWithoutIDs().wrap('div');
    this.destinationElementWrapper = this.element.wrap('div');

    this.transitionElement.insert(this.sourceElementWrapper).insert(this.destinationElementWrapper);

    var sourceHeight = this.sourceElementWrapper.getHeight(), 
      sourceWidth = this.sourceElementWrapper.getWidth();
      
    this.options.change();

    var destinationHeight = this.destinationElementWrapper.getHeight(),
      destinationWidth  = this.destinationElementWrapper.getWidth();

    this.outerWrapper = new Element("div");
    this.transitionElement.insert({ before: this.outerWrapper });
    this.outerWrapper.setStyle({ 
      overflow: "hidden", height: sourceHeight + "px", width: sourceWidth + "px" 
    }).appendChild(this.transitionElement);

    var maxHeight = Math.max(destinationHeight, sourceHeight), maxWidth = Math.max(destinationWidth, sourceWidth);
      
    this.transitionElement.setStyle({ height: sourceHeight + "px", width: sourceWidth + "px" });
    this.sourceElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0 });
    this.destinationElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0, opacity: 0, zIndex: 2000 });

    this.outerWrapper.insert({ before: this.transitionElement }).remove();
    
    this.animate('style', this.transitionElement, { style: 'height:' + destinationHeight + 'px; width:' + destinationWidth + 'px' });
    this.animate('style', this.destinationElementWrapper, { style: 'opacity: 1.0' });
  },
  
  teardownWrappers: function() {
    var destinationElement = this.destinationElementWrapper.down();
    
    if (destinationElement)
      this.transitionElement.insert({ before: destinationElement });
    
    this.transitionElement.remove();
  }
});

Effect.Scroll = Class.create(Effect.Element, {
  setup: function(){
    this.animate('scroll', this.element, { scrollTo: this.options.to });
  }
});

Effect.Transitions = {
  linear: Prototype.K,
  
  sinusoidal: function(pos) {
    return (-Math.cos(pos*Math.PI)/2) + 0.5;
  },
  
  reverse: function(pos) {
    return 1 - pos;
  },
  
  flicker: function(pos) {
    return Math.max((-Math.cos(pos*Math.PI)/4) + 0.75 + Math.random()/4, 1);
  },
  
  wobble: function(pos) {
    return (-Math.cos(pos*Math.PI*(9*pos))/2) + 0.5;
  },
  
  pulse: function(pos, pulses) { 
    pulses = pulses || 5; 
    return (
      ((pos % (1/pulses)) * pulses).round() == 0 ? 
            ((pos * pulses * 2) - (pos * pulses * 2).floor()) : 
        1 - ((pos * pulses * 2) - (pos * pulses * 2).floor())
      );
  },
  
  spring: function(pos) { 
    return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6)); 
  },
  
  none: Prototype.K.curry(0),

  full: Prototype.K.curry(1)
};

/*
Based on Easing Equations v2.0
(c) 2003 Robert Penner, all rights reserved.
This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html

Adapted for Scriptaculous by Ken Snyder (kendsnyder ~at~ gmail ~dot~ com) June 2006
*/

Object.extend(Effect.Transitions, {
  elastic: function(pos) {
    return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
  },
  
  swingFromTo: function(pos) {
    var s = 1.70158;
    return ((pos/=0.5) < 1) ? 0.5*(pos*pos*(((s*=(1.525))+1)*pos - s)) :
      0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos + s) + 2);
  },
  
  swingFrom: function(pos) {
    var s = 1.70158;
    return pos*pos*((s+1)*pos - s);
  },
  
  swingTo: function(pos) {
    var s = 1.70158;
    return (pos-=1)*pos*((s+1)*pos + s) + 1;
  },
  
  bounce: function(pos) {
    if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
        return (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
        return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
        return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },
  
  bouncePast: function(pos) {
    if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
        return 2 - (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
        return 2 - (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
        return 2 - (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },
  
  easeFromTo: function(pos) {
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);   
  },
  
  easeFrom: function(pos) {
    return Math.pow(pos,4);
  },
  
  easeTo: function(pos) {
    return Math.pow(pos,0.25);
  }
});

