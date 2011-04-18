var TAGS =
  ['div','span','ol','ul','table','p','h1','h2','h3','h4','h5','h6'];

var COMBINED_EFFECTS =
  ['Fade','Appear','BlindUp','BlindDown','Puff','SwitchOff','DropOut','Shake',
   'SlideUp','SlideDown','Pulsate','Squish','Fold','Grow','Shrink'];

var COMBINED_RJS_EFFECTS = $w('fade appear blind_up blind_down puff switch_off '+
  'drop_out shake slide_up slide_down pulsate squish fold grow shrink');
   
var tmp, tmp2;

new Test.Unit.Runner({

  setup: function() { with(this) {
    $('sandbox').innerHTML = "sandbox";
    S2.FX.DefaultOptions.accelerate = false;
    S2.FX.DefaultOptions.engine = 'javascript';
  }},
  
  teardown: function() { with(this) {
    // remove all queued effects
    //Effect.Queue.each(function(e) { e.cancel() });
  }},

  testQueuing: function() { with(this) {
    new S2.FX.Morph('sandbox',{ style: 'font-size:10px' }).play();
    var q = S2.FX.DefaultOptions.queue;
    assertEqual(1, q.getEffects().length);
    wait(500, function(){
      assertEqual(0, q.getEffects().length);
      
      new S2.FX.Morph('sandbox',{ style: 'font-size:20px' }).play();
      new S2.FX.Morph('sandbox',{ style: 'color:#fff' }).play();
      assertEqual(2, q.getEffects().length);
      
      wait(500, function(){
        assertEqual(0, q.getEffects().length);
      });
    });
  }},
  
  testMorphChaining: function() { with(this) {
    $('sandbox').morph('font-size:10px').morph('color:#fff');
    wait(300, function(){
      assertEqual('10px', $('sandbox').getStyle('font-size'));
      assertNotEqual('#fff', $('sandbox').getStyle('color'));
      wait(300, function(){
        $('sandbox').morph('font-size:20px').morph('color:#000',{ position: 'parallel' });
        wait(300, function(){
          assertEqual('20px', $('sandbox').getStyle('font-size'));
          assertNotEqual('#000', $('sandbox').getStyle('color'));
        });
      });
    });
  }},
  
  testExceptionOnNonExistingElement: function() { with(this) {
    assertRaise('ElementDoesNotExistError',
      function(){new S2.FX.Morph('nothing-to-see-here',{style:'font-size:50px'})});
  }},
  
  // TODO: add tests for S2.FX.Parallel, incl. callbacks
  
  testCallbacks: function() { with(this) {
    var tmp = 0;
    var e1 = new S2.FX.Morph('sandbox',{style:'',delay:1,duration:0.5,
      before: function() { tmp++ },
      after:  function() { tmp++ }
    }).play();
    assertEqual(0, tmp);
    wait(500, function(){
      wait(750, function(){
        assertEqual(1, tmp);
        wait(500, function() {
          assertEqual(2, tmp);
        });
      });
    });
  }},
  
  testAfterEvent: function() { with(this) {
    tmp = 0;
    var i = 6;
    while(i--) $('e'+(i+1)).setStyle('font-size:10px')
      .morph('font-size:12px',{ duration:.05, after:function(){ tmp++ } });
    
    wait(250, function() {
      assertEqual(6, tmp);
    
      tmp = 0;
      $('sandbox').setStyle('font-size:11px');
      $('sandbox').morph('font-size:11px', { after:function(){ tmp++ }, duration: .05 });
      
      // for consistency, the after event should always be called
      // even if there's no animation
      wait(100, function() {
        assertEqual(1, tmp);
      });
    });
  }},
  
  testBeforeEvent: function() { with(this) {
    tmp = 0;
    var i = 6;
    while(i--) $('e'+(i+1)).setStyle('font-size:10px')
      .morph('font-size:12px',{ duration:.05, before:function(){ tmp++ } });
    
    wait(250, function() {
      assertEqual(6, tmp);
    
      tmp = 0;
      $('sandbox').setStyle('font-size:11px');
      $('sandbox').morph('font-size:11px', { before:function(){ tmp++ }, duration: .05 });
      
      // for consistency, the before event should always be called
      // even if there's no animation
      wait(100, function() {
        assertEqual(1, tmp);
        
        // test delayed execution
        tmp = 0;
        $('sandbox').setStyle('font-size:11px');
        $('sandbox').morph('font-size:12px', { 
          before:function(){ tmp++ }, duration: .05, delay: .5 
        });
        wait(100, function() {
          assertEqual(0, tmp);
          wait(750, function() {
            assertEqual(1, tmp);
          })
        });
      });
      
      
    });
  }},
  
  testTransition: function() { with(this) {
    // false implies linear
    var e = new S2.FX.Morph('sandbox',{transition:false,style:'opacity:0.25',duration:0.5}).play();
    assert(e.options.transition === S2.FX.Transitions.linear);
    
    wait(1000, function() {
      assertEqual(0.25, $('sandbox').getStyle('opacity'));
      // default to sinoidal
      var e = new S2.FX.Morph('sandbox',{style:'opacity:0.25',duration:0.5}).play();
      assert(e.options.transition === S2.FX.Transitions.sinusoidal);

      wait(1000, function() {
        assertEqual(0.25, $('sandbox').getStyle('opacity'));
        
        var transitions = [
          { transition: 'linear',     expected0: 0, expected1: 1 },
          { transition: 'sinusoidal', expected0: 0, expected1: 1 },
          { transition: 'reverse',    expected0: 1, expected1: 0 },
          { transition: 'wobble',     expected0: 0, expected1: 1 },
          { transition: 'pulse',      expected0: 0, expected1: 1 },
          { transition: 'none',       expected0: 0, expected1: 0 },
          { transition: 'full',       expected0: 1, expected1: 1 }
        ];
        
        transitions.each(function(t){
          assertEqual(t.expected0, S2.FX.Transitions[t.transition](0), t.transition + '@0');
          assertEqual(t.expected1, S2.FX.Transitions[t.transition](1), t.transition + '@1');
        });
        
        $('sandbox').setStyle('font-size:10px');
        var e = new S2.FX.Morph('sandbox',{style:'font-size:5px',transition:'none'}).play();
        wait(10, function(){
          assertEqual('10px', $('sandbox').getStyle('font-size'));
        });
        
      });
    });
  }},
  
  testReplayability: function() { with(this) {
    var e1 = new S2.FX.Morph('sandbox',{style:'font-size:5px',duration:0.5});
    
    $('sandbox').setStyle('font-size:15px');
    assertEqual('15px', $('sandbox').getStyle('font-size'));
    e1.play();
    wait(750, function(){
      assertEqual('5px', $('sandbox').getStyle('font-size'));
      $('sandbox').setStyle('font-size:15px');
      assertEqual('15px', $('sandbox').getStyle('font-size'));
      assertEqual(1, e1.operators.length);
      e1.play();
      wait(750, function(){
        assertEqual('5px', $('sandbox').getStyle('font-size'));
        assertEqual(1, e1.operators.length);
      });
    });
  }},
 
  testReplayabilityWithDifferentOptions: function() { with(this) {
    var e1 = new S2.FX.Morph('sandbox',{style:'font-size:5px',duration:0.5});
    
    $('sandbox').setStyle('font-size:15px');
    assertEqual('15px', $('sandbox').getStyle('font-size'));
    e1.play();
    wait(750, function(){
      assertEqual('5px', $('sandbox').getStyle('font-size'));
      $('sandbox').setStyle('font-size:15px');
      assertEqual('15px', $('sandbox').getStyle('font-size'));
      assertEqual(1, e1.operators.length);
      e1.play(null, {style: 'font-size:25px'});
      wait(750, function(){
        assertEqual('25px', $('sandbox').getStyle('font-size'));
        assertEqual(1, e1.operators.length);
        e1.play(null, {style: 'font-size:10px'});
        wait(750, function(){
          assertEqual('10px', $('sandbox').getStyle('font-size'));
          assertEqual(1, e1.operators.length);
        });
      });
    });
  }},
  
  testInspect: function() { with(this) {
    var e1 = new S2.FX.Morph('sandbox',{style:'font-size:5px',duration:0.5});
    assertEqual(0, e1.inspect().indexOf('#<S2.FX:'));
    assert(e1.inspect().indexOf('idle')>0);
    e1.play();
    wait(1000, function() {
      assert(e1.inspect().indexOf('finished')>0);
    });
  }},
  
  testDefaultOptions: function() { with(this) {
    var oldDefaultOptions = Object.extend({}, S2.FX.DefaultOptions);
    assertEqual(0.2, S2.FX.DefaultOptions.duration);
    S2.FX.DefaultOptions.duration = 0.1;
    var e1 = (new S2.FX.Morph('sandbox',{ style:'font-size:100px'})).play();
    assertEqual(0.1, e1.options.duration);
    wait(500, function() {
      assertEqual('finished', e1.state);
      S2.FX.DefaultOptions = oldDefaultOptions;
    });
  }},
  
  testParseOptions: function() { with(this) {
    var opt;
    
    opt = S2.FX.parseOptions();
    assertNotUndefined(opt);

    opt = S2.FX.parseOptions({duration:1,blech:'2'});
    assert('duration' in opt);
    assert('blech' in opt);
    
    opt = S2.FX.parseOptions('slow');
    assertEqual(1, opt.duration);
    
    opt = S2.FX.parseOptions('fast');
    assertEqual(.1, opt.duration);
    
    opt = S2.FX.parseOptions('blech');
    assertEqual(S2.FX.DefaultOptions.duration, opt.duration);
    
    opt = S2.FX.parseOptions(4);
    assertEqual(4, opt.duration);
    
    var f = function(){};
    opt = S2.FX.parseOptions(f);
    assertIdentical(opt.after, f);
  }},
  
  testShortcutOptions: function() { with(this) {
    var testVar="?";    
    $('sandbox').morph('font-size:10px', 0.05);
    wait(150, function() {
      assertEqual('10px', $('sandbox').getStyle('font-size'));
      $('sandbox').morph('font-size:20px',function(){ testVar='!'; });
      wait(500, function() {
        assertEqual('!', testVar);
        $('sandbox').morph('font-size:30px','slow');
        wait(600, function(){
          assertNotEqual('30px', $('sandbox').getStyle('font-size'), 'slow half-way');
          wait(600, function(){
            assertEqual('30px', $('sandbox').getStyle('font-size'), 'slow at end');
            $('sandbox').morph('font-size:7px','fast');
            wait(150, function(){
              assertEqual('7px', $('sandbox').getStyle('font-size'), 'fast at end');
            });
          });
        })
      });
    });
  }},

  testEffectsParallel: function() { with(this) {
    var calledStart = false, calledCancel = false;

    var effect = new S2.FX.SlideDown('sandbox');
    var start = effect.start, cancel = effect.cancel;

    // wrap methods
    effect.start = function() {
      calledStart = true;
      start.call(effect);
    };
    effect.cancel = function(after) {
      calledCancel = true;
      cancel.call(effect, after);
    };

    (new S2.FX.Parallel([effect],{ duration:0.75 })).play();

    wait(800, function() {
      assertEqual(calledStart, true);
      assertEqual(calledCancel, true);
    });
  }},
  
  testElementMorph: function() { with(this) {
    $('error_test_ul').morph('font-size:40px', {duration: 0.75}).setStyle({marginRight:'17px'});
    $('error_message_2').morph({
      fontSize:         '20px',
      color:            '#f00',
      backgroundColor:  '#ffffff'
    },{ duration:0.75 });
    assertEqual('10px', $('error_test_ul').getStyle('font-size'));
    wait(100, function(){
      assertNotEqual('10px',$('error_test_ul').getStyle('font-size'));
      assertNotEqual('40px',$('error_test_ul').getStyle('font-size'));
      wait(1000,function(){
        assertEqual('17px', $('error_test_ul').getStyle('margin-right'));
        assertEqual('40px', $('error_test_ul').getStyle('font-size'));
        assertEqual('#ffffff', S2.CSS.colorFromString($('error_message_2').getStyle('background-color')));
        assertEqual('20px', $('error_message_2').getStyle('font-size'));
      });
    });
  }}
  
});