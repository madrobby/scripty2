new Test.Unit.Runner({
  testFitIntoRectangle: function(){ with(this) {
    var fits = [
      [10, 10, 100, 100], 
      [100, 100, 100, 100],
      [50, 100, 200, 100],
      [50, 100, 100, 200],
      [100, 50, 200, 100],
      [100, 50, 100, 200],
      [500, 100, 200, 100],
      [500, 100, 100, 200]
    ];
    
    var solution = [
      [0, 0, 100, 100],
      [0, 0, 100, 100],
      [75, 0, 50, 100],
      [0, 0, 100, 200],
      [0, 0, 200, 100],
      [0, 75, 100, 50],
      [0, 30, 200, 40],
      [0, 90, 100, 20]
    ];
    
    fits.each( function(fit,index){
      assertEnumEqual(solution[index], S2.FX.Helpers.fitIntoRectangle(fit[0], fit[1], fit[2], fit[3]));
    });
  }}
  
});