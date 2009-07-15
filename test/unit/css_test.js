new Test.Unit.Runner({
  
  testInterpolationMethods: function() { with(this) {
    // numbers
    assertEqual(1, s2.css.interpolateNumber(1, 3, 0));
    assertEqual(3, s2.css.interpolateNumber(1, 3, 1));
    assertEqual(2, s2.css.interpolateNumber(1, 3, 0.5));
    assertEqual(4, s2.css.interpolateNumber(1, 3, 1.5));
    assertEqual(-1, s2.css.interpolateNumber(1, 3, -1));
    assertEqual(2, s2.css.interpolateNumber(0, 4, .5));
    assertEqual(2, s2.css.interpolateNumber(undefined, 4, .5));
    assertEqual(2, s2.css.interpolateNumber(null, 4, .5));
    
    assertEqual(1, s2.css.interpolateInteger(1, 3, 0));
    assertEqual(2, s2.css.interpolateInteger(1, 3, 0.5));
    assertEqual(3, s2.css.interpolateInteger(1, 3, 1));
    assertEqual(2, s2.css.interpolateInteger(1, 3, 0.25));
    assertEqual(3, s2.css.interpolateInteger(1, 3, 0.75));
    
    // lengths em|ex|px|in|cm|mm|pt|pc
    assertEqual('1px', s2.css.interpolateLength('1px', '3px', 0));
    assertEqual('3ex', s2.css.interpolateLength('1ex', '3ex', 1));
    assertEqual('2px', s2.css.interpolateLength('1px', '3px', 0.5));
    assertEqual('4in', s2.css.interpolateLength('1in', '3in', 1.5));
    assertEqual('-1cm', s2.css.interpolateLength('1cm', '3cm', -1));
    assertEqual('-1mm', s2.css.interpolateLength('1mm', '3mm', -1));
    assertEqual('-1pt', s2.css.interpolateLength('1pt', '3pt', -1));
    assertEqual('-1pc', s2.css.interpolateLength('1pc', '3pc', -1));
    assertEqual('-2.5cm', s2.css.interpolateLength('5cm', '-5cm', .75));
    assertEqual('2px', s2.css.interpolateLength('', '4px', .5));
    assertEqual('2px', s2.css.interpolateLength(null, '4px', .5));
    assertEqual('2px', s2.css.interpolateLength(undefined, '4px', .5));
    
    // leave alone whitespace, we're only interested in replacing the value
    assertEqual('  -1  pc  ', s2.css.interpolateLength('  1  pc  ', ' \n3 \t pc  ', -1));
    
    // precentages
    assertEqual('50%', s2.css.interpolateLength('0%', '100%', 0.5));
    
    // colors
    assertEqual('#ffffff', s2.css.interpolateColor('#ffffff', '#000000', 0));
    assertEqual('#000000', s2.css.interpolateColor('#ffffff', '#000000', 1));
    
    // check that values are capped
    assertEqual('#ffffff', s2.css.interpolateColor('#ffffff', '#000000', -1));
    assertEqual('#000000', s2.css.interpolateColor('#ffffff', '#000000', 2));
    
    assertEqual('#111111', s2.css.interpolateColor('#000000', '#222222', .5));
    assertEqual('#111111', s2.css.interpolateColor('#000', '#222', .5));
    assertEqual('#444444', s2.css.interpolateColor('#000', '#222', 2));
    assertEqual('#111111', s2.css.interpolateColor('rgb(0,0,0)', '#222', .5));
    assertEqual('#111111', s2.css.interpolateColor('#000', 'rgb(34,34,34)', .5));
  }},
  
  testPropertyInterpolation: function() { with(this) {
    assertEqual('#111111', s2.css.interpolate('background-color','#000000','#222222',.5));
    assertEqual('#111111', s2.css.interpolate('background-color','#000','#222222',.5));
    assertEqual('#111111', s2.css.interpolate('backgroundColor','#000000','#222222',.5));
    
    assertEqual('0px', s2.css.interpolate('margin-top','10px','0px',.99999));
    assertEqual('10px', s2.css.interpolate('margin-top','10px','0px',.00001));
    
    assertEqual('0.5', s2.css.interpolate('opacity',0,1,.5));
    assertEqual('0.000', s2.css.interpolate('opacity',0,1,.00000001));
    
    assertEqual('2', s2.css.interpolate('z-index','1','3',.5));
  }},
  
  testStyleParsing: function() { with(this) {
    assertEqual('12px', s2.css.parseStyle('font-size:12px').fontSize);
    assertEqual('12pt', s2.css.parseStyle('font-size:12pt').fontSize);
    assertEqual('12em', s2.css.parseStyle('font-size:12em').fontSize);
    assertEqual('12%', s2.css.parseStyle('font-size:12%').fontSize);
    assertEqual('12ex', s2.css.parseStyle('font-size:12ex').fontSize);
    assertEqual('12in', s2.css.parseStyle('font-size:12in').fontSize);
    assertEqual('12cm', s2.css.parseStyle('font-size:12cm').fontSize);
    assertEqual('12mm', s2.css.parseStyle('font-size:12mm').fontSize);
    assertEqual('12pc', s2.css.parseStyle('font-size:12pc').fontSize);
    
    assertEqual('12px', s2.css.parseStyle(' font-size: 12px').fontSize);
    assertEqual('12px', s2.css.parseStyle('\r\nfont-size: 12px\r\n').fontSize);
    assertEqual('12px', s2.css.parseStyle('font-size: 12px  \t\t').fontSize);
    assertEqual('12px', s2.css.parseStyle('\t\tfont-size:\t12px').fontSize);
    
    assertEqual('12px', s2.css.parseStyle(' font-size: 11px;font-size: 12px').fontSize);
    assertEqual('12px', s2.css.parseStyle('line-height: 11px;\r\nfont-size: 12px\r\n').fontSize);
    assertEqual('12px', s2.css.parseStyle('font-size: 12px;  \t\tline-height: 11px;').fontSize);
    assertEqual('12px', s2.css.parseStyle('line-height: 11px;\t\tfont-size:\t12px;color: white;').fontSize);
    
    assertIdentical(undefined, s2.css.parseStyle('').fontSize);
    assertIdentical(undefined, s2.css.parseStyle('font-size:12pxfont-size:12px').fontSize);
  }},
  
  testGetStyles: function() { with(this) {
    assertEqual('12px', $('allStyles_1').getStyles().fontSize);
    assertEqual(1, parseFloat($('allStyles_1').getStyles().opacity));
    assertEqual(0.5, parseFloat($('allStyles_2').getStyles().opacity));
    assertEqual(0.5, parseFloat($('allStyles_3').getStyles().opacity));
  }},
  
  testColorParsing: function() { with(this) {
    assertEnumEqual([171, 206, 223], s2.css.normalizeColor('#abcedf'));
    assertEnumEqual([170, 187, 204], s2.css.normalizeColor('#abc'));
    assertEnumEqual([0, 0, 0], s2.css.normalizeColor('#000'));
    assertEnumEqual([0, 255, 0], s2.css.normalizeColor('rgb(0,255,0)'));
    
    assert(isNaN(s2.css.normalizeColor('#abcedfgh')[0]));
    assert(isNaN(s2.css.normalizeColor('#abcedfgh')[1]));
    assert(isNaN(s2.css.normalizeColor('#abcedfgh')[2]));
  }}
  
});