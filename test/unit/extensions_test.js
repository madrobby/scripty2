
new Test.Unit.Runner({  
  testNumberTween: function(){ with(this) {
    assertEqual(0, (0).tween(1, 0));
    assertEqual(.5, (0).tween(1, .5));
    assertEqual(1, (0).tween(1, 1));
    
    assertEqual(25, (20).tween(30, .5));
    
    assertEqual(50, (100).tween(0, .5));
    assertEqual(33.33, (100).tween(0, 2/3).toFixed(2));
    assertEqual(66.67, (100).tween(0, 1/3).toFixed(2));
    
    assertEqual(Infinity, (0).tween(Infinity, 1));
    assertEqual(Infinity, (0).tween(Infinity, 0.000001));
    assert(isNaN((0).tween(Infinity, 0)));
    
    assert(isNaN(NaN, (0).tween(NaN, 0)));
    assert(isNaN(NaN, (NaN).tween(NaN, 0)));
  }},
  
  testObjectPropertize: function(){ with(this) {
		var propertizeTransitions = function(prop) { 
			return Object.propertize(prop, S2.FX.Transitions);
		};
    assertEqual(propertizeTransitions('sinusoidal'), S2.FX.Transitions.sinusoidal);
		assertEqual(propertizeTransitions(S2.FX.Transitions.sinusoidal), S2.FX.Transitions.sinusoidal);
  }},
  
  testFunctionOptionize: function(){ with(this) {
    var o = {a:1}
        optionize = (function(a,b,options) {
          return options;
        }).optionize(),
      
    // options set to last object
    assertEqual(o, optionize(o));
    assertEqual(o, optionize(1,o));
    assertEqual(o, optionize(1,2,o));
    
    // unless the argument is already filled in
    assertEqual(3, optionize(1,2,3,o));
  }}
});
