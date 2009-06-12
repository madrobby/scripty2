/** section: Effects
 * s2.fx.Transitions
 *
 * Transitions can fine-tune how an effect evolves over time. All effects, 
 * without the use of transitions, normally evolve linearily.
 * 
 * All transitions take a `position` argument, which is between
 * 0 (start of effect) and 1 (end of effect). Transitions return a number,
 * which is a "translation" of `position` argument. The return value can,
 * depending on transition type, be above 1 or below 0.
 *
 * By using Transitions, it is easily possible to add movement easing,
 * pulsation, bouncing, reversal and other forms of special effects.
 *
 * <h4>Default transition</h4
 *
 * If no transition option is given to an effect, [[s2.fx.Transitions.sinusoidal]] is used.
 * This setting can be changed by redifining [[s2.fx.DefaultOptions.transition]].
 *
 * <h4>Implementing your own transitions</h4>
 *
 * Transitions can easily be added, by using this template:
 *
 *     Object.extend(s2.fx.Transitions, {
 *       myTransition: function(pos) {
 *         return pos; // do your calculations here!
 *       }
 *     });
 *
 * Transitions defined this way automatically become available to be used with
 * the shorthand syntax for the `options.transition` argument:
 *
 *     $('some_element').morph('left:300px', { transition: 'myTransition' });
**/

s2.fx.Transitions = {
  
  /**
   *  s2.fx.Transitions.linear(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Basic linear transition, no easing or other alteration of the effect.
   *  <div class="transition"></div>
  **/
  linear: Prototype.K,
  
  /**
   *  s2.fx.Transitions.sinusoidal(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Alters the effect timing to be aligned to a sine wave.
   *  <div class="transition"></div>
  **/
  sinusoidal: function(pos) {
    return (-Math.cos(pos*Math.PI)/2) + 0.5;
  },
  
  /**
   *  s2.fx.Transitions.reverse(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Effect is executed in a reverse linear fashion.
   *  <div class="transition"></div>
  **/
  reverse: function(pos) {
    return 1 - pos;
  },
  
  /**
   *  s2.fx.Transitions.flicker(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Effect flickers along a sine wave.
   *  <div class="transition"></div>
  **/
  flicker: function(pos) {
    return Math.max((-Math.cos(pos*Math.PI)/4) + 0.75 + Math.random()/4, 1);
  },
  
  /**
   *  s2.fx.Transitions.wobble(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Effect wobbles increasingly fast between start and end positions.
   *  <div class="transition"></div>
  **/
  wobble: function(pos) {
    return (-Math.cos(pos*Math.PI*(9*pos))/2) + 0.5;
  },
  
  /**
   *  s2.fx.Transitions.pulse(pos[, pulses]) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *  - pulses (Number): Number of pulses, defaults to 5
   *
   *  Effect pulses along a sinusoidal transition.
   *  <div class="transition"></div>
  **/
  pulse: function(pos, pulses) { 
    return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
  },
  
  /**
   *  s2.fx.Transitions.spring(pos) -> Number
   *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
   *
   *  Alters the effect timing to a "spring".
   *  <div class="transition"></div>
  **/
  spring: function(pos) { 
    return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6)); 
  },
  
  /**
   *  s2.fx.Transitions.none() -> Number
   *
   *  No transition, the effect stays in intial state (returns 0 regardless of input values).
   *  <div class="transition"></div>
  **/
  none: Prototype.K.curry(0),

  /**
   *  s2.fx.Transitions.full() -> Number
   *
   *  No transition, the effect is always in final state (returns 1 regardless of input values).
   *  <div class="transition"></div>
  **/
  full: Prototype.K.curry(1)
};

//= require <effects/transitions/penner>