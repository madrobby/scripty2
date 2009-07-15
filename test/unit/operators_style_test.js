new Test.Unit.Runner({ 
  testStyle: function(){ with(this) {
    var operator = new S2.FX.Operators.Style(null, 'style_test', { style: 'font-size:20px' });
    assertMatch(/10px/, operator.valueAt(0));
    assertMatch(/15px/, operator.valueAt(.5));
    assertMatch(/20px/, operator.valueAt(1));
  }},
  
  testStyleSubvalues: function(){ with(this) {
    var operator = new S2.FX.Operators.Style(null, 'style_test_subvalues', 
      { style: ' border-left-width: 10px ' }
    );
    
    assertMatch(/30px/, operator.valueAt(0));
    assertMatch(/20px/, operator.valueAt(.5));
    assertMatch(/10px/, operator.valueAt(1));
  }},
  
  testStyleColors: function(){ with(this) {
    var operator = new S2.FX.Operators.Style(null, 'style_test_colors', 
      { style: 'color:#987654; background-color: #fff ' }
    );
    
    assertMatch(/color:#aabbcc/, operator.valueAt(0));
    assertMatch(/color:#a19990/, operator.valueAt(.5));
    assertMatch(/color:#987654/, operator.valueAt(1));
    
    assertMatch(/background-color:#123456/, operator.valueAt(0));
    assertMatch(/background-color:#899aab/, operator.valueAt(.5));
    assertMatch(/background-color:#ffffff/, operator.valueAt(1));
  }}
});