new Test.Unit.Runner({
  
  // TODO
  testS2Defined: function() { with(this) {
    assertType(String, s2.Version);
    assertRespondsTo('tween', 1, 'Number prototype extensions not found?');
  }}
  
});