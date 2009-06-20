// Based on Easing Equations (c) 2003 Robert Penner, all rights reserved.
// This work is subject to the terms in http://www.robertpenner.com/easing_terms_of_use.html
// Adapted for script.aculo.us by
// Brian Crescimanno <brian.crescimanno@gmail.com>
// Ken Snyder <kendsnyder@gmail.com)

/*!
 *  TERMS OF USE - EASING EQUATIONS
 *  Open source under the BSD License.
 *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
 */

Object.extend(s2.fx.Transitions, {
  /**
   *  s2.fx.Transitions.easeInQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuad: function(pos){
     return Math.pow(pos, 2);
  },

  /**
   *  s2.fx.Transitions.easeOutQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuad: function(pos){
    return -(Math.pow((pos-1), 2) -1);
  },

  /**
   *  s2.fx.Transitions.easeInOutQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuad: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,2);
    return -0.5 * ((pos-=2)*pos - 2);
  },

  /**
   *  s2.fx.Transitions.easeInCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInCubic: function(pos){
    return Math.pow(pos, 3);
  },

  /**
   *  s2.fx.Transitions.easeOutCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutCubic: function(pos){
    return (Math.pow((pos-1), 3) +1);
  },

  /**
   *  s2.fx.Transitions.easeInOutCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutCubic: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,3);
    return 0.5 * (Math.pow((pos-2),3) + 2);
  },

  /**
   *  s2.fx.Transitions.easeInQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuart: function(pos){
    return Math.pow(pos, 4);
  },

  /**
   *  s2.fx.Transitions.easeOutQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuart: function(pos){
    return -(Math.pow((pos-1), 4) -1)
  },

  /**
   *  s2.fx.Transitions.easeInOutQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuart: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  /**
   *  s2.fx.Transitions.easeInQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuint: function(pos){
    return Math.pow(pos, 5);
  },

  /**
   *  s2.fx.Transitions.easeOutQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuint: function(pos){
    return (Math.pow((pos-1), 5) +1);
  },

  /**
   *  s2.fx.Transitions.easeInOutQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuint: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,5);
    return 0.5 * (Math.pow((pos-2),5) + 2);
  },

  /**
   *  s2.fx.Transitions.easeInSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInSine: function(pos){
    return -Math.cos(pos * (Math.PI/2)) + 1;
  },

  /**
   *  s2.fx.Transitions.easeOutSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutSine: function(pos){
    return Math.sin(pos * (Math.PI/2));
  },

  /**
   *  s2.fx.Transitions.easeInOutSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutSine: function(pos){
    return (-.5 * (Math.cos(Math.PI*pos) -1));
  },

  /**
   *  s2.fx.Transitions.easeInExpo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInExpo: function(pos){
    return (pos==0) ? 0 : Math.pow(2, 10 * (pos - 1));
  },

  /**
   *  s2.fx.Transitions.easeOutExpo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutExpo: function(pos){
    return (pos==1) ? 1 : -Math.pow(2, -10 * pos) + 1;
  },

  /**
   *  s2.fx.Transitions.easeInOutExpo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutExpo: function(pos){
    if(pos==0) return 0;
    if(pos==1) return 1;
    if((pos/=0.5) < 1) return 0.5 * Math.pow(2,10 * (pos-1));
    return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
  },

  /**
   *  s2.fx.Transitions.easeInCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInCirc: function(pos){
    return -(Math.sqrt(1 - (pos*pos)) - 1);
  },

  /**
   *  s2.fx.Transitions.easeOutCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutCirc: function(pos){
    return Math.sqrt(1 - Math.pow((pos-1), 2))
  },

  /**
   *  s2.fx.Transitions.easeInOutCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutCirc: function(pos){
    if((pos/=0.5) < 1) return -0.5 * (Math.sqrt(1 - pos*pos) - 1);
    return 0.5 * (Math.sqrt(1 - (pos-=2)*pos) + 1);
  },

  /**
   *  s2.fx.Transitions.easeOutBounce(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutBounce: function(pos){
    if ((pos) < (1/2.75)) {
      return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
      return (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
      return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
      return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },

  /**
   *  s2.fx.Transitions.easeInBack(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInBack: function(pos){
    var s = 1.70158;
    return (pos)*pos*((s+1)*pos - s);
  },

  /**
   *  s2.fx.Transitions.easeOutBack(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutBack: function(pos){
    var s = 1.70158;
    return (pos=pos-1)*pos*((s+1)*pos + s) + 1;
  },

  /**
   *  s2.fx.Transitions.easeInOutBack(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutBack: function(pos){
    var s = 1.70158;
    if((pos/=0.5) < 1) return 0.5*(pos*pos*(((s*=(1.525))+1)*pos -s));
    return 0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos +s) +2);
  },

  /**
   *  s2.fx.Transitions.elastic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  elastic: function(pos) {
    return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
  },

  /**
   *  s2.fx.Transitions.swingFromTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  swingFromTo: function(pos) {
    var s = 1.70158;
    return ((pos/=0.5) < 1) ? 0.5*(pos*pos*(((s*=(1.525))+1)*pos - s)) :
      0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos + s) + 2);
  },

  /**
   *  s2.fx.Transitions.swingFrom(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  swingFrom: function(pos) {
    var s = 1.70158;
    return pos*pos*((s+1)*pos - s);
  },

  /**
   *  s2.fx.Transitions.swingTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  swingTo: function(pos) {
    var s = 1.70158;
    return (pos-=1)*pos*((s+1)*pos + s) + 1;
  },

  /**
   *  s2.fx.Transitions.bounce(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
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

  /**
   *  s2.fx.Transitions.bouncePast(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
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

  /**
   *  s2.fx.Transitions.easeFromTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeFromTo: function(pos) {
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  /**
   *  s2.fx.Transitions.easeFrom(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeFrom: function(pos) {
    return Math.pow(pos,4);
  },

  /**
   *  s2.fx.Transitions.easeTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeTo: function(pos) {
    return Math.pow(pos,0.25);
  }
});