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
  }},
  
  teardown: function() { with(this) {
    // remove all queued effects
    //Effect.Queue.each(function(e) { e.cancel() });
  }},
  
  testExceptionOnNonExistingElement: function() { with(this) {
    assertRaise('ElementDoesNotExistError',
      function(){new s2.fx.Morph('nothing-to-see-here',{style:'font-size:50px'})});
  }},
  
  testCallbacks: function() { with(this) {
    var tmp = 0;
    var e1 = new s2.fx.Morph('sandbox',{style:'',delay:1,duration:0.5,
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
  
  testHeartbeat: function() { with(this) {
    var tmp = 0, tmp2 = 0;
    document.observe('effect:heartbeat', function(){
      tmp++;
    });
    assertEqual(0, tmp);
    wait(250, function(){
      assertEqual(0, tmp);
      new s2.fx.Morph('sandbox',{style:'',delay:1,duration:0.5}).play();
      wait(750, function(){
        assert(tmp > 0);
        tmp2 = tmp;
        wait(250, function(){
          info(tmp);
          info(tmp2);
          assert(tmp2 == tmp); // heartbeats shouldn't continue when no fx running
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
    var e = new s2.fx.Morph('sandbox',{transition:false,style:'opacity:0.25',duration:0.5}).play();
    assert(e.options.transition === s2.fx.Transitions.linear);
    
    wait(1000, function() {
      assertEqual(0.25, $('sandbox').getStyle('opacity'));
      // default to sinoidal
      var e = new s2.fx.Morph('sandbox',{style:'opacity:0.25',duration:0.5}).play();
      assert(e.options.transition === s2.fx.Transitions.sinusoidal);

      wait(1000, function() {
        assertEqual(0.25, $('sandbox').getStyle('opacity'));
        
        var transitions = [
          { transition: 'linear',     expected0: 0, expected1: 1 },
          { transition: 'sinusoidal', expected0: 0, expected1: 1 },
          { transition: 'reverse',    expected0: 1, expected1: 0 },
          { transition: 'flicker',    expected0: 0, expected1: 1 },
          { transition: 'wobble',     expected0: 0, expected1: 1 },
          { transition: 'pulse',      expected0: 0, expected1: 1 },
          { transition: 'none',       expected0: 0, expected1: 0 },
          { transition: 'full',       expected0: 1, expected1: 1 }
        ];
        
        transitions.each(function(t){
          assertEqual(t.expected0, s2.fx.Transitions[t.transition](0));
          assertEqual(t.expected1, s2.fx.Transitions[t.transition](1));
        });
        
        $('sandbox').setStyle('font-size:10px');
        var e = new s2.fx.Morph('sandbox',{style:'font-size:5px',transition:'none'}).play();
        wait(10, function(){
          assertEqual('10px', $('sandbox').getStyle('font-size'));
        });
        
      });
    });
  }},
  
  testReplayability: function() { with(this) {
    var e1 = new s2.fx.Morph('sandbox',{style:'font-size:5px',duration:0.5});
    
    $('sandbox').setStyle('font-size:15px');
    assertEqual('15px', $('sandbox').getStyle('font-size'));
    e1.play();
    wait(750, function(){
      assertEqual('5px', $('sandbox').getStyle('font-size'));
      $('sandbox').setStyle('font-size:15px');
      assertEqual('15px', $('sandbox').getStyle('font-size'));
      e1.play();
      wait(750, function(){
        assertEqual('5px', $('sandbox').getStyle('font-size'));
      });
    });
  }},
  
  testInspect: function() { with(this) {
    var e1 = new s2.fx.Morph('sandbox',{style:'font-size:5px',duration:0.5});
    assertEqual(0, e1.inspect().indexOf('#<s2.fx:'));
    assert(e1.inspect().indexOf('idle')>0);
    e1.play();
    wait(1000, function() {
      assert(e1.inspect().indexOf('finished')>0);
    });
  }},
  
  testDefaultOptions: function() { with(this) {
    var oldDefaultOptions = Object.extend({}, s2.fx.DefaultOptions);
    assertEqual(1.0, s2.fx.DefaultOptions.duration);
    s2.fx.DefaultOptions.duration = 0.1;
    var e1 = (new s2.fx.Morph('sandbox',{ style:'font-size:100px'})).play();
    assertEqual(0.1, e1.options.duration);
    wait(500, function() {
      assertEqual('finished', e1.state);
      s2.fx.DefaultOptions = oldDefaultOptions;
    });
  }},
  
  testElementMorph: function() { with(this) {
    $('error_test_ul').morph('font-size:40px', {duration: 0.75}).setStyle({marginRight:'17px'});
    $('error_message_2').morph({
      fontSize:         '20px',
      color:            '#f00',
      backgroundColor:  '#ffffff'
    },{ duration:0.75 });
    assertEqual('10px', $('error_test_ul').getStyle('font-size'), 'fails with CSS Transition support');
    wait(100, function(){
      assertNotEqual('10px',$('error_test_ul').getStyle('font-size'));
      assertNotEqual('40px',$('error_test_ul').getStyle('font-size'), 'fails with CSS Transition support');
      wait(1000,function(){
        assertEqual('17px', $('error_test_ul').getStyle('margin-right'));
        assertEqual('40px', $('error_test_ul').getStyle('font-size'));
        assertEqual('#ffffff', s2.css.colorFromString($('error_message_2').getStyle('background-color')));
        assertEqual('20px', $('error_message_2').getStyle('font-size'));
      });
    });
  }},

  testElementMorphChaining: function() { with(this) {
    $('error_message').setStyle('font-size:10px;opacity:1').morph('font-size:17px').morph('opacity:0',{delay:2});
    wait(3100,function(){ // 2000ms delay + 1000ms default duration
      assertEqual(0, $('error_message').getStyle('opacity'));
    });
  }}

});