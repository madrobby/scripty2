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

Object.extend(S2.FX.Transitions, {
  /**
   *  S2.FX.Transitions.easeInQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuad: function(pos){
     return Math.pow(pos, 2);
  },

  /**
   *  S2.FX.Transitions.easeOutQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuad: function(pos){
    return -(Math.pow((pos-1), 2) -1);
  },

  /**
   *  S2.FX.Transitions.easeInOutQuad(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuad: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,2);
    return -0.5 * ((pos-=2)*pos - 2);
  },

  /**
   *  S2.FX.Transitions.easeInCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInCubic: function(pos){
    return Math.pow(pos, 3);
  },

  /**
   *  S2.FX.Transitions.easeOutCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutCubic: function(pos){
    return (Math.pow((pos-1), 3) +1);
  },

  /**
   *  S2.FX.Transitions.easeInOutCubic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutCubic: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,3);
    return 0.5 * (Math.pow((pos-2),3) + 2);
  },

  /**
   *  S2.FX.Transitions.easeInQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuart: function(pos){
    return Math.pow(pos, 4);
  },

  /**
   *  S2.FX.Transitions.easeOutQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuart: function(pos){
    return -(Math.pow((pos-1), 4) -1)
  },

  /**
   *  S2.FX.Transitions.easeInOutQuart(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuart: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  /**
   *  S2.FX.Transitions.easeInQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInQuint: function(pos){
    return Math.pow(pos, 5);
  },

  /**
   *  S2.FX.Transitions.easeOutQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutQuint: function(pos){
    return (Math.pow((pos-1), 5) +1);
  },

  /**
   *  S2.FX.Transitions.easeInOutQuint(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutQuint: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,5);
    return 0.5 * (Math.pow((pos-2),5) + 2);
  },

  /**
   *  S2.FX.Transitions.easeInSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInSine: function(pos){
    return -Math.cos(pos * (Math.PI/2)) + 1;
  },

  /**
   *  S2.FX.Transitions.easeOutSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutSine: function(pos){
    return Math.sin(pos * (Math.PI/2));
  },

  /**
   *  S2.FX.Transitions.easeInOutSine(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutSine: function(pos){
    return (-.5 * (Math.cos(Math.PI*pos) -1));
  },

  /**
   *  S2.FX.Transitions.easeInExpo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInExpo: function(pos){
    return (pos==0) ? 0 : Math.pow(2, 10 * (pos - 1));
  },

  /**
   *  S2.FX.Transitions.easeOutExpo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutExpo: function(pos){
    return (pos==1) ? 1 : -Math.pow(2, -10 * pos) + 1;
  },

  /**
   *  S2.FX.Transitions.easeInOutExpo(pos) -> Number
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
   *  S2.FX.Transitions.easeInCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInCirc: function(pos){
    return -(Math.sqrt(1 - (pos*pos)) - 1);
  },

  /**
   *  S2.FX.Transitions.easeOutCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutCirc: function(pos){
    return Math.sqrt(1 - Math.pow((pos-1), 2))
  },

  /**
   *  S2.FX.Transitions.easeInOutCirc(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInOutCirc: function(pos){
    if((pos/=0.5) < 1) return -0.5 * (Math.sqrt(1 - pos*pos) - 1);
    return 0.5 * (Math.sqrt(1 - (pos-=2)*pos) + 1);
  },

  /**
   *  S2.FX.Transitions.easeOutBounce(pos) -> Number
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
   *  S2.FX.Transitions.easeInBack(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeInBack: function(pos){
    var s = 1.70158;
    return (pos)*pos*((s+1)*pos - s);
  },

  /**
   *  S2.FX.Transitions.easeOutBack(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeOutBack: function(pos){
    var s = 1.70158;
    return (pos=pos-1)*pos*((s+1)*pos + s) + 1;
  },

  /**
   *  S2.FX.Transitions.easeInOutBack(pos) -> Number
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
   *  S2.FX.Transitions.elastic(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  elastic: function(pos) {
    return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
  },

  /**
   *  S2.FX.Transitions.swingFromTo(pos) -> Number
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
   *  S2.FX.Transitions.swingFrom(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  swingFrom: function(pos) {
    var s = 1.70158;
    return pos*pos*((s+1)*pos - s);
  },

  /**
   *  S2.FX.Transitions.swingTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  swingTo: function(pos) {
    var s = 1.70158;
    return (pos-=1)*pos*((s+1)*pos + s) + 1;
  },

  /**
   *  S2.FX.Transitions.bounce(pos) -> Number
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
   *  S2.FX.Transitions.bouncePast(pos) -> Number
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
   *  S2.FX.Transitions.easeFromTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeFromTo: function(pos) {
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  /**
   *  S2.FX.Transitions.easeFrom(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeFrom: function(pos) {
    return Math.pow(pos,4);
  },

  /**
   *  S2.FX.Transitions.easeTo(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  <div class="transition"></div>
  **/
  easeTo: function(pos) {
    return Math.pow(pos,0.25);
  }
});