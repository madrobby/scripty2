/**
 *  class S2.FX.SlideDown < S2.FX.Element
 *  
 *  Effect to hide an element by animating its CSS `height`, `padding-top`,
 *  and `padding-bottom` from their ordinary values to zero.
**/

S2.FX.SlideDown = Class.create(S2.FX.Element, {
  setup: function() {
    var element = this.destinationElement || this.element;
    var layout = element.getLayout();

    var style = {
      height:        layout.get('height') + 'px',
      paddingTop:    layout.get('padding-top') + 'px',
      paddingBottom: layout.get('padding-bottom') + 'px'
    };

    element.setStyle({
      height:         '0',
      paddingTop:     '0',
      paddingBottom:  '0',
      overflow:       'hidden'
    }).show();
    
    this.animate('style', element, {
      style: style,
      propertyTransitions: {}
    });
  },
  
  teardown: function() {
    var element = this.destinationElement || this.element;    
    element.setStyle({
      height:         '',
      paddingTop:     '',
      paddingBottom:  '',
      overflow:       'visible'
    });
  }
});

S2.FX.SlideUp = Class.create(S2.FX.Morph, {
  setup: function() {
    var element = this.destinationElement || this.element;
    var layout = element.getLayout();

    var style = {
      height:        '0px',
      paddingTop:    '0px',
      paddingBottom: '0px'
    };

    element.setStyle({ overflow: 'hidden' });
    
    this.animate('style', element, {
      style: style,
      propertyTransitions: {}
    });
  },
  
  teardown: function() {
    var element = this.destinationElement || this.element;    
    element.setStyle({
      height:         '',
      paddingTop:     '',
      paddingBottom:  '',
      overflow:       'visible'
    }).hide();
  }
});