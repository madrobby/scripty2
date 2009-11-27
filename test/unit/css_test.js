new Test.Unit.Runner({
  
  testInterpolationMethods: function() { with(this) {
    // numbers
    assertEqual(1, S2.CSS.interpolateNumber(1, 3, 0));
    assertEqual(3, S2.CSS.interpolateNumber(1, 3, 1));
    assertEqual(2, S2.CSS.interpolateNumber(1, 3, 0.5));
    assertEqual(4, S2.CSS.interpolateNumber(1, 3, 1.5));
    assertEqual(-1, S2.CSS.interpolateNumber(1, 3, -1));
    assertEqual(2, S2.CSS.interpolateNumber(0, 4, .5));
    assertEqual(2, S2.CSS.interpolateNumber(undefined, 4, .5));
    assertEqual(2, S2.CSS.interpolateNumber(null, 4, .5));
    
    assertEqual(1, S2.CSS.interpolateInteger(1, 3, 0));
    assertEqual(2, S2.CSS.interpolateInteger(1, 3, 0.5));
    assertEqual(3, S2.CSS.interpolateInteger(1, 3, 1));
    assertEqual(2, S2.CSS.interpolateInteger(1, 3, 0.25));
    assertEqual(3, S2.CSS.interpolateInteger(1, 3, 0.75));
    
    // lengths em|ex|px|in|cm|mm|pt|pc
    assertEqual('1px', S2.CSS.interpolateLength('1px', '3px', 0));
    assertEqual('3ex', S2.CSS.interpolateLength('1ex', '3ex', 1));
    assertEqual('2px', S2.CSS.interpolateLength('1px', '3px', 0.5));
    assertEqual('4in', S2.CSS.interpolateLength('1in', '3in', 1.5));
    assertEqual('-1cm', S2.CSS.interpolateLength('1cm', '3cm', -1));
    assertEqual('-1mm', S2.CSS.interpolateLength('1mm', '3mm', -1));
    assertEqual('-1pt', S2.CSS.interpolateLength('1pt', '3pt', -1));
    assertEqual('-1pc', S2.CSS.interpolateLength('1pc', '3pc', -1));
    assertEqual('-2.5cm', S2.CSS.interpolateLength('5cm', '-5cm', .75));
    assertEqual('2px', S2.CSS.interpolateLength('', '4px', .5));
    assertEqual('2px', S2.CSS.interpolateLength(null, '4px', .5));
    assertEqual('2px', S2.CSS.interpolateLength(undefined, '4px', .5));
    assertEqual('0px', S2.CSS.interpolateLength('0pt', '4px', 0));
    assertEqual('2px', S2.CSS.interpolateLength('0pt', '4px', 0.5));
    assertEqual('4px', S2.CSS.interpolateLength('0pt', '4px', 1));
    
    // leave alone whitespace, we're only interested in replacing the value
    assertEqual('  -1  pc  ', S2.CSS.interpolateLength('  1  pc  ', ' \n3 \t pc  ', -1));
    
    // precentages
    assertEqual('50%', S2.CSS.interpolateLength('0%', '100%', 0.5));
    
    // colors
    assertEqual('#ffffff', S2.CSS.interpolateColor('#ffffff', '#000000', 0));
    assertEqual('#000000', S2.CSS.interpolateColor('#ffffff', '#000000', 1));
    
    // check that values are capped
    assertEqual('#ffffff', S2.CSS.interpolateColor('#ffffff', '#000000', -1));
    assertEqual('#000000', S2.CSS.interpolateColor('#ffffff', '#000000', 2));
    
    assertEqual('#111111', S2.CSS.interpolateColor('#000000', '#222222', .5));
    assertEqual('#111111', S2.CSS.interpolateColor('#000', '#222', .5));
    assertEqual('#444444', S2.CSS.interpolateColor('#000', '#222', 2));
    assertEqual('#111111', S2.CSS.interpolateColor('rgb(0,0,0)', '#222', .5));
    assertEqual('#111111', S2.CSS.interpolateColor('#000', 'rgb(34,34,34)', .5));
  }},
  
  testPropertyInterpolation: function() { with(this) {
    assertEqual('#111111', S2.CSS.interpolate('background-color','#000000','#222222',.5));
    assertEqual('#111111', S2.CSS.interpolate('background-color','#000','#222222',.5));
    assertEqual('#111111', S2.CSS.interpolate('backgroundColor','#000000','#222222',.5));
    
    assertEqual('0px', S2.CSS.interpolate('margin-top','10px','0px',.99999));
    assertEqual('10px', S2.CSS.interpolate('margin-top','10px','0px',.00001));
    
    assertEqual('0.5', S2.CSS.interpolate('opacity',0,1,.5));
    assertEqual('0.000', S2.CSS.interpolate('opacity',0,1,.00000001));
    
    assertEqual('2', S2.CSS.interpolate('z-index','1','3',.5));
  }},
  
  testStyleParsing: function() { with(this) {
    assertEqual('12px', S2.CSS.parseStyle('font-size:12px').fontSize);
    assertEqual('12pt', S2.CSS.parseStyle('font-size:12pt').fontSize);
    assertEqual('12em', S2.CSS.parseStyle('font-size:12em').fontSize);
    assertEqual('12%', S2.CSS.parseStyle('font-size:12%').fontSize);
    assertEqual('12ex', S2.CSS.parseStyle('font-size:12ex').fontSize);
    assertEqual('12in', S2.CSS.parseStyle('font-size:12in').fontSize);
    assertEqual('12cm', S2.CSS.parseStyle('font-size:12cm').fontSize);
    assertEqual('12mm', S2.CSS.parseStyle('font-size:12mm').fontSize);
    assertEqual('12pc', S2.CSS.parseStyle('font-size:12pc').fontSize);
    
    assertEqual('12px', S2.CSS.parseStyle(' font-size: 12px').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('\r\nfont-size: 12px\r\n').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('font-size: 12px  \t\t').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('\t\tfont-size:\t12px').fontSize);
    
    assertEqual('12px', S2.CSS.parseStyle(' font-size: 11px;font-size: 12px').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('line-height: 11px;\r\nfont-size: 12px\r\n').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('font-size: 12px;  \t\tline-height: 11px;').fontSize);
    assertEqual('12px', S2.CSS.parseStyle('line-height: 11px;\t\tfont-size:\t12px;color: white;').fontSize);
    
    assertIdentical(undefined, S2.CSS.parseStyle('').fontSize);
    assertIdentical(undefined, S2.CSS.parseStyle('font-size:12pxfont-size:12px').fontSize);
  }},
  
  testGetStyles: function() { with(this) {
    assertEqual('12px', $('allStyles_1').getStyles().fontSize);
    assertEqual(1, parseFloat($('allStyles_1').getStyles().opacity));
    assertEqual(0.5, parseFloat($('allStyles_2').getStyles().opacity));
    assertEqual(0.5, parseFloat($('allStyles_3').getStyles().opacity));
  }},
  
  testColorParsing: function() { with(this) {
    assertEnumEqual([171, 206, 223], S2.CSS.normalizeColor('#abcedf'));
    assertEnumEqual([170, 187, 204], S2.CSS.normalizeColor('#abc'));
    assertEnumEqual([0, 0, 0], S2.CSS.normalizeColor('#000'));
    assertEnumEqual([0, 255, 0], S2.CSS.normalizeColor('rgb(0,255,0)'));
    
    assert(isNaN(S2.CSS.normalizeColor('#abcedfgh')[0]));
    assert(isNaN(S2.CSS.normalizeColor('#abcedfgh')[1]));
    assert(isNaN(S2.CSS.normalizeColor('#abcedfgh')[2]));

    assertEqual("#ffffff", S2.CSS.colorFromString("#fff"));
    assertEqual("#ffffff", S2.CSS.colorFromString("#ffffff"));
    assertEqual("#ffffff", S2.CSS.colorFromString("rgb(255,255,255)"));
    assertEqual("transparent", S2.CSS.colorFromString("transparent"));

    // rgba support not implemented. Should something with alpha 0 return "transparent"?
    //assertEqual("#ffffff", S2.CSS.colorFromString("rgba(255,255,255,0)"));
    //assertEqual("#000000", S2.CSS.colorFromString("rgba(0,0,0,0)"));
  }}
  
});
