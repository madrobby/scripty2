s2.fx.Transitions = {
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
    return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
  },
  
  spring: function(pos) { 
    return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6)); 
  },
  
  none: Prototype.K.curry(0),

  full: Prototype.K.curry(1)
};

//= require <effects/transitions/penner>