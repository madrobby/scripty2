/**
 * == CSS ==
 * Utility functions for CSS parsing, color normalization and tweening.
**/

/** section: CSS
 * s2.css
 * Utility functions for CSS parsing, color normalization and tweening.
**/
s2.css = {
  PROPERTY_MAP: {
    backgroundColor: 'color',
    borderBottomColor: 'color',
    borderBottomWidth: 'length',
    borderLeftColor: 'color',
    borderLeftWidth: 'length',
    borderRightColor: 'color',
    borderRightWidth: 'length',
    borderSpacing: 'length',
    borderTopColor: 'color',
    borderTopWidth: 'length',
    bottom: 'length',
    color: 'color',
    fontSize: 'length',
    fontWeight: 'integer',
    height: 'length',
    left: 'length',
    letterSpacing: 'length',
    lineHeight: 'length',
    marginBottom: 'length',
    marginLeft: 'length',
    marginRight: 'length',
    marginTop: 'length',
    maxHeight: 'length',
    maxWidth: 'length',
    minHeight: 'length',
    minWidth: 'length',
    opacity: 'number',
    outlineColor: 'color',
    outlineOffset: 'length',
    outlineWidth: 'length',
    paddingBottom: 'length',
    paddingLeft: 'length',
    paddingRight: 'length',
    paddingTop: 'length',
    right: 'length',
    textIndent: 'length',
    top: 'length',
    width: 'length',
    wordSpacing: 'length',
    zIndex: 'integer',
    zoom: 'number'
  },
  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,
  NUMBER: /([\+-]*\d+\.?\d*)/,

  __parseStyleElement: document.createElement('div'),
  
  /**
   * s2.css.parseStyle(string) -> Object
   * Takes a string of CSS rules and parses them into key/value pairs. Colors and
   * opacity settings on IE are normalized.
   *  <h4>Methods you may find useful</h4>
   *  
   *  Instances of the `Request` object provide several methods that can come in
   *  handy in your callback functions, especially once the request is complete.
   *  
   *  <h5>Is the response a successful one?</h5>
   *  
   *  The [[Ajax.Request#success]] method examines the XHR object's `status`
   *  property and follows general HTTP guidelines: unknown status is deemed
   *  successful, as is the whole `2xy` status code family. It's a generally
   *  better way of testing your response than the usual
   *  `200 == transport.status`.
   *  
   *  <h5>Getting HTTP response headers</h5>
   *
   *  While you can obtain response headers from the XHR object using its
   *  `getResponseHeader` method, this makes for verbose code, and several
   *  implementations raise an exception when the header is not found. To make
   *  this easier, you can use the [[Ajax.Response#getHeader]] method, which
   *  delegates to the longer version and returns `null` if an exception occurs:
   *  
   *      new Ajax.Request('/your/url', {
   *        onSuccess: function(response) {
   *          // Note how we brace against null values
   *          if ((response.getHeader('Server') || '').match(/Apache/))
   *            ++gApacheCount;
   *          // Remainder of the code
   *        }
   *      });
   *  
   *  <h5>Evaluating JSON headers</h5>
   *
   **/
  parseStyle: function(styleString) {
    s2.css.__parseStyleElement.innerHTML = '<div style="' + styleString + '"></div>';
    var style = s2.css.__parseStyleElement.childNodes[0].style, styleRules = {};

    s2.css.NUMERIC_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = style[property]; 
    });

    s2.css.COLOR_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = s2.css.colorFromString(style[property]);
    });
    
    if (Prototype.Browser.IE && styleString.include('opacity'))
      styleRules.opacity = styleString.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1];

    return styleRules;
  },
  
  /**
   * s2.css.normalizeColor(color) -> String
   **/
  normalizeColor: function(color) {
    if (!color || ['rgba(0, 0, 0, 0)','transparent'].include(color)) color = '#ffffff';
    color = s2.css.colorFromString(color);
    return [0,1,2].map(function(i){ return parseInt(color.slice(i*2+1,i*2+3), 16) });
  },
  
  colorFromString: function(color) {
    var value = '#', cols, i;
    if (color.slice(0,4) == 'rgb(') {
      cols = color.slice(4,color.length-1).split(',');
      i=0; do { value += parseInt(cols[i]).toColorPart() } while (++i<3);
    } else {
      if (color.slice(0,1) == '#') {
        if (color.length==4) for(i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();
        if (color.length==7) value = color.toLowerCase();
      }
    }
    return (value.length==7 ? value : (arguments[1] || value));
  },
  
  interpolateColor: function(from, to, position){
    from = s2.css.normalizeColor(from);
    to = s2.css.normalizeColor(to);
    
    return '#' + [0,1,2].map(function(index){ 
      return Math.max(Math.min(from[index].tween(to[index], position).round(), 255), 0).toColorPart();
    }).join('');
  },
  
  interpolateNumber: function(from, to, position){
    return (from||0).tween(to, position);
  },

  interpolateLength: function(from, to, position){
    if(!from) from = '0'+to.gsub(s2.css.NUMBER,'');
    to.scan(s2.css.NUMBER, function(match){ to = parseFloat(match[1]); });
    return from.gsub(s2.css.NUMBER, function(match){
      return parseFloat(match[1]).tween(to, position).toString();
    });
  },
  
  interpolatePercentage: function(from, to, position){
    return s2.css.interpolateLength(from, to, position);
  },
  
  interpolateInteger: function(from, to, position){
    return from.tween(to, position).round();
  },
  
  interpolate: function(property, from, to, position){
    return s2.css['interpolate'+s2.css.PROPERTY_MAP[property.camelize()].capitalize()](from, to, position);
  },

  ElementMethods: {
    getStyles: function(element) {
      var css = document.defaultView.getComputedStyle($(element), null);
      return s2.css.PROPERTIES.inject({ }, function(styles, property) {
        styles[property] = css[property];
        return styles;
      });
    }
  }
};

s2.css.PROPERTIES = [];
for(property in s2.css.PROPERTY_MAP) s2.css.PROPERTIES.push(property);

s2.css.NUMERIC_PROPERTIES = s2.css.PROPERTIES.findAll(function(property){ return !property.endsWith('olor') });
s2.css.COLOR_PROPERTIES   = s2.css.PROPERTIES.findAll(function(property){ return property.endsWith('olor') });

if (!(document.defaultView && document.defaultView.getComputedStyle)) {
  s2.css.ElementMethods.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = s2.css.PROPERTIES.inject({ }, function(hash, property) {
      hash[property] = css[property];
      return hash;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
};

Element.addMethods(s2.css.ElementMethods);