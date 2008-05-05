var CSS = {
  PROPERTIES: $w(
    'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' + 
    'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
    'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
    'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
    'fontSize fontWeight height left letterSpacing lineHeight ' +
    'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
    'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
    'right textIndent top width wordSpacing zIndex'),
  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,

  __parseStyleElement: document.createElement('div'),
  parseStyle: function(styleString) {
    CSS.__parseStyleElement.innerHTML = '<div style="' + styleString + '"></div>';
    var style = CSS.__parseStyleElement.childNodes[0].style, styleRules = {};

    CSS.NUMERIC_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = style[property]; 
    });

    CSS.COLOR_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = CSS.Color.fromString(style[property]);
    });

    if (Prototype.Browser.IE && styleString.include('opacity'))
      styleRules.opacity = styleString.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1];

    return styleRules;
  },

  Color: {
    normalize: function(color) {
      if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
      color = CSS.Color.fromString(color);
      return [0,1,2].map(function(i){ return parseInt(color.slice(i*2+1,i*2+3), 16) });
    },

    fromString: function(color) {
      var value = '#';
      if (color.slice(0,4) == 'rgb(') {
        var cols = color.slice(4,color.length-1).split(',');
        var i=0; do { value += parseInt(cols[i]).toColorPart() } while (++i<3);
      } else {
        if (color.slice(0,1) == '#') {
          if (color.length==4) for(var i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();
          if (color.length==7) value = color.toLowerCase();
        }
      }
      return (value.length==7 ? value : (arguments[1] || value));
    }
  },

  ElementMethods: {
    getStyles: function(element) {
      var css = document.defaultView.getComputedStyle($(element), null);
      return CSS.PROPERTIES.inject({ }, function(styles, property) {
        styles[property] = css[property];
        return styles;
      });
    }
  }
};

CSS.NUMERIC_PROPERTIES = CSS.PROPERTIES.findAll(function(property){ return !property.endsWith('olor') });
CSS.COLOR_PROPERTIES   = CSS.PROPERTIES.findAll(function(property){ return property.endsWith('olor') });

if (!(document.defaultView && document.defaultView.getComputedStyle)) {
  CSS.ElementMethods.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = CSS.PROPERTIES.inject({ }, function(hash, property) {
      hash[property] = css[property];
      return hash;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
};

Element.addMethods(CSS.ElementMethods);