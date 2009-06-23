/** section: scripty2 ui
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
  
  /**
   *  s2.css.LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/
   *  Regular expression for a CSS length, for example 12px, 8.4in, 13% or 0.
  **/
  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,
  
  /**
   *  s2.css.NUMBER = /([\+-]*\d+\.?\d*)/
   *  Regular expression for a CSS numeric value, for example '+12.90', '-2' or '21.5'.
  **/
  NUMBER: /([\+-]*\d+\.?\d*)/,

  __parseStyleElement: document.createElement('div'),
  
  /**
   *  s2.css.parseStyle(string) -> Object
   *  Takes a string of CSS rules and parses them into key/value pairs. 
   *  Shortcut properties, colors and opacity settings on IE are normalized.
   *  
   *  Example:
   *  
   *      s2.css.parseStyle('font-size:11px; border:12px solid #abc; border-left-width: 5px') ->
   *      
   *      {
   *        borderBottomColor: '#aabbcc',
   *        borderBottomWidth: '12px',
   *        borderLeftColor:   '#aabbcc',
   *        borderLeftWidth:   '#5px',
   *        borderRightColor:  '#aabbcc',
   *        borderRightWidth:  '12px',
   *        borderTopColor:    '#aabbcc',
   *        borderTopWidth:    '12px',
   *        fontSize:          '11px'
   *      }
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
   *  s2.css.normalizeColor(color) -> Array
   *  - color (String): Color in #abc, #aabbcc or rgba(1,2,3) format
   *  
   *  Returns the value of a CSS color as a RGB triplet:
   *  
   *  * #abc       -> [170, 187, 204]
   *  * #aabbcc    -> not changed
   *  * rgb(1,2,3) -> [1, 2, 3]
   *  * #xyz       -> [NaN, NaN, NaN]
   *  
   *  This method does not support HTML color constants.
  **/
  normalizeColor: function(color) {
    if (!color || color == 'rgba(0, 0, 0, 0)' || color == 'transparent') color = '#ffffff';
    color = s2.css.colorFromString(color);
    return [
      parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)
    ];
  },
  
  /**
   *  s2.css.colorFromString(color) -> String
   *  - color (String): Color in #abc, #aabbcc or rgba(1,2,3) format
   *  
   *  Returns a normalized color in the #aabbcc format.
   *  
   *  * #abc -> Expanded to #aabbcc
   *  * #aabbcc -> not changed
   *  * rgb(1,2,3) -> Expanded to #010203
   *  * other input -> not changed
   *  
   *  This method does not support HTML color constants.
  **/
  colorFromString: function(color) {
    var value = '#', cols, i;
    if (color.slice(0,4) == 'rgb(') {
      cols = color.slice(4,color.length-1).split(',');
      i=3; while(i--) value += parseInt(cols[2-i]).toColorPart();
    } else {
      if (color.slice(0,1) == '#') {
        if (color.length==4) for(i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();
        if (color.length==7) value = color.toLowerCase();
      }
    }
    return (value.length==7 ? value : (arguments[1] || value));
  },
  
  /**
   *  s2.css.interpolateColor(from, to, position) -> String
   *  - from (String): Original color in #abc, #aabbcc or rgba(1,2,3) format
   *  - to (String): Target color in #abc, #aabbcc or rgba(1,2,3) format
   *  - position (Number): interpolation position between 0 (original) and 1 (target)
   *  
   *  Returns a color in #aabbcc format for an arbitrary position between two colors. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      s2.css.interpolateColor('#ffffff', '#000000', 0.5) -> '#808080'
   *  
   *  This method does not support HTML color constants as input values.
  **/
  interpolateColor: function(from, to, position){
    from = s2.css.normalizeColor(from);
    to = s2.css.normalizeColor(to);
    
    return '#' + [0,1,2].map(function(index){ 
      return Math.max(Math.min(from[index].tween(to[index], position).round(), 255), 0).toColorPart();
    }).join('');
  },
  
  /**
   *  s2.css.interpolateNumber(from, to, position) -> Number
   *  - from (Number): Original number
   *  - to (Number): Target number
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a number for an arbitrary position between two numbers. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      s2.css.interpolateNumber(1, 2, 0.5)  -> 1.5
   *      s2.css.interpolateNumber(1.5, 4.5, 0.1) -> 1.8
   *      s2.css.interpolateNumber(1, 10, 2)   -> 3
   *      s2.css.interpolateNumber(1, 2, -0.5) -> 0.5
  **/
  interpolateNumber: function(from, to, position){
    return (from||0).tween(to, position);
  },

  /**
   *  s2.css.interpolateLength(from, to, position) -> String
   *  - from (Number): Original CSS length
   *  - to (Number): Target CSS length (unit must be the same as in the `from` argument)
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a CSS length for an arbitrary position between two CSS lengths. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      s2.css.interpolateLength('12px','18px',0.5)-> '15px'
   *      s2.css.interpolateLength('10%','30%',0.7) -> '24%'
  **/
  interpolateLength: function(from, to, position){
    if(!from) from = '0'+to.gsub(s2.css.NUMBER,'');
    to.scan(s2.css.NUMBER, function(match){ to = parseFloat(match[1]); });
    return from.gsub(s2.css.NUMBER, function(match){
      return parseFloat(match[1]).tween(to, position).toString();
    });
  },
  
  /**
   *  s2.css.interpolateInteger(from, to, position) -> Number
   *  - from (Number): Original number
   *  - to (Number): Target number
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a number rounded to the next integer for an arbitrary position between two numbers. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      s2.css.interpolateInteger(1, 5, 0.5);  -> 3
   *      s2.css.interpolateInteger(2, 4, 0.1);  -> 2
   *      s2.css.interpolateInteger(1, 10, 2);   -> 19
   *      s2.css.interpolateInteger(1, 2, -0.5); -> 1
  **/
  interpolateInteger: function(from, to, position){
    return parseInt(from).tween(to, position).round();
  },
  
  /**
   *  s2.css.interpolate(property, from, to, position) -> Number | String
   *  - property (String): CSS property name to interpolate (e.g. 'font-size')
   *  - from (String | Number): Original value
   *  - to (String | Number): Target value
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns the value for an arbitrary position between two CSS property values. 
   *  The type of interpolation will be automatically choosen based on the the CSS property.
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      s2.css.interpolate('font-size', '14px', '18px', 0.5) -> '16px'
   *      s2.css.interpolate('background-color', '#abc', '#def', 0.5) -> '#c4d5e6'
   *      s2.css.interpolate('opacity', 1, 0, 0.75) -> 0.25
   *      s2.css.interpolate('zIndex', 1, 10, 0.75) -> 8
   *
   *  To generate a list of supported CSS properties and types, use:
   *
   *      $H(s2.css.PROPERTY_MAP).map(function(v){
   *        return v[0].underscore().dasherize(r)+' ('+v[1]+')';
   *      }).join(', ');
  **/
  interpolate: function(property, from, to, position){
    return s2.css['interpolate'+s2.css.PROPERTY_MAP[property.camelize()].capitalize()](from, to, position);
  },

  ElementMethods: {
    /**
     *  Element.getStyles(@element) -> Object
     *  - element (String | Object): DOM object or element ID
     *  
     *  Returns an object with all currently applied style attributes for
     *  a given DOM object. This includes all styles from stylesheets,
     *  properties set with style attributes and CSS properties set with
     *  the DOM API.
    **/
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