

s2.fx.SlideDown = Class.create(s2.fx.Element, {
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

s2.fx.SlideUp = Class.create(s2.fx.Morph, {
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