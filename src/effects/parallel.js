/**
 *  class S2.FX.Parallel < S2.FX.Base
 *
 *  Effect to execute several other effects in parallel.
 *
 *  Instead of reitering what already exists for [[S2.FX]] and [[S2.FX.Base]], lets
 *  just get down to business with a quick example!
 *
 *  <h4>Morphing 2 elements example</h4>
 *  
 *      new S2.FX.Parallel([                              // the parallel effect itself
 *         new S2.FX.Morph('element1_id', {               // morph element1_id
 *            after: function()                           // after execution function
 *            {
 *               $('element2_id').update('morphing!');    // write this after executing
 *            },
 *            delay: 0.1,                                 // just a little starting delay
 *            duration: 0.9,                              // duration should equal 1 sec w/ delay
 *            position: 'parallel',                       // the queue position is 'parallel'
 *            style: 'height: 150px; width: 350px;',      // resize our first element from 0x0
 *            transition: 'spring'                        // a transition for element morphing
 *         }),
 *         new S2.FX.Morph('element2_id', {               // morph element2_id
 *            after: function()                           // after execution function
 *            {
 *               $('element2_id').update('finished!');    // write this after executing
 *            },
 *            delay: 0.25,                                // delay this slightly behind above
 *            duration: 0.75,                             // duration should equal 1 sec w/ delay
 *            position: 'parallel',                       // the queue position is 'parallel'
 *            style: 'opacity: 1; color: orange;',        // morph the text we inserted
 *            transition: 'easeInOutCubic'                // a transition for the text morphing
 *         }),
 *      ],{
 *         duration: 1                                    // the overall length of this effect
 *      });
 *
 *  <h4>Notes</h4>
 *
 *  It is recommended that you set any effects position to "parallel" to ensure
 *  that it will be executed properly.
 *
 *  As shown above, anything from [[S2.FX.Base]] can be applied to the parallel
 *  effect itself.
**/
S2.FX.Parallel = Class.create(S2.FX.Base, {
  initialize: function($super, effects, options) {
    this.effects = effects || [];
    return $super(options || {});
  },

  setup: function() {
    this.effects.invoke('setup');
  },

  update: function(position) {
    this.effects.invoke('update', position);
  }
});