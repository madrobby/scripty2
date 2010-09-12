/** section: scripty2 fx
 * S2.CSS
 * Utility functions for CSS parsing, color normalization and tweening.
**/
S2.CSS = {
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
  
  // An attempt to support vendor-specific properties in a sane way.
  // TODO: Do more research into what ought to be added to this list.
  VENDOR: {
    // Determined below.
    PREFIX: null,
    
    // Lookups for possible supported vendor-specific properties
    LOOKUP_PREFIXES: ['webkit', 'Moz', 'O'],
    LOOKUP_PROPERTIES: $w('BorderRadius BoxShadow Transform Transition ' + 
     'TransitionDuration TransitionTimingFunction TransitionProperty ' +
     'TransitionDelay ' + 
     'BorderTopLeftRadius BorderTopRightRadius BorderBottomLeftRadius ' + 
     'BorderBottomRightRadius'
    ),
    LOOKUP_EDGE_CASES: {
      'BorderTopLeftRadius': 'BorderRadiusTopleft',
      'BorderTopRightRadius': 'BorderRadiusTopright',
      'BorderBottomLeftRadius': 'BorderRadiusBottomleft',
      'BorderBottomRightRadius': 'BorderRadiusBottomright'
    },
    
    // Populated below.
    PROPERTY_MAP: {}
  },
  
  /**
   *  S2.CSS.LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/
   *  Regular expression for a CSS length, for example 12px, 8.4in, 13% or 0.
  **/
  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,
  
  /**
   *  S2.CSS.NUMBER = /([\+-]*\d+\.?\d*)/
   *  Regular expression for a CSS numeric value, for example '+12.90', '-2' or '21.5'.
  **/
  NUMBER: /([\+-]*\d+\.?\d*)/,

  __parseStyleElement: document.createElement('div'),
  
  /**
   *  S2.CSS.parseStyle(string) -> Object
   *  Takes a string of CSS rules and parses them into key/value pairs. 
   *  Shortcut properties, colors and opacity settings on IE are normalized.
   *  
   *  Example:
   *  
   *      S2.CSS.parseStyle('font-size:11px; border:12px solid #abc; border-left-width: 5px') ->
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
    S2.CSS.__parseStyleElement.innerHTML = '<div style="' + styleString + '"></div>';
    var style = S2.CSS.__parseStyleElement.childNodes[0].style, styleRules = {};

    S2.CSS.NUMERIC_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = style[property]; 
    });

    S2.CSS.COLOR_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = S2.CSS.colorFromString(style[property]);
    });
    
    if (Prototype.Browser.IE && styleString.include('opacity'))
      styleRules.opacity = styleString.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1];

    return styleRules;
  },
  
  parse: function(styleString) {
    return S2.CSS.parseStyle(styleString);
  },
  
  /**
   *  S2.CSS.normalize(element, style) -> Object
   *  - element (Element): The element on which the styles will be applied.
   *  - style (Object | String): The styles to be applied to the element.
   *  
   *  "Normalizes" the given CSS by removing lines that will have no effect
   *  on the element. For instance, will remove "width: 200px" from the style
   *  if the element is _already_ `200px` wide.
   *  
  **/
  normalize: function(element, style) {
    if (Object.isHash(style)) style = style.toObject();
    if (typeof style === 'string') style = S2.CSS.parseStyle(style);
    
    var result = {}, current;
    
    for (var property in style) {
      current = element.getStyle(property);
      if (style[property] !== current) {
        result[property] = style[property];
      }
    }

    return result;
  },

  /**
   *  S2.CSS.serialize(object) -> String
   *  - object (Object): An object of CSS property-value pairs.
   *  
   *  Converts an object of CSS property-value pairs into a string
   *  suitable for setting an element's `cssText` property.
  **/
  serialize: function(object) {
    if (Object.isHash(object)) object = object.toObject();
    var output = "", value;
    for (var property in object) {
      value = object[property];
      property = this.vendorizeProperty(property);
      output += (property + ": " + value + ';');
    }    
    return output;
  },
  
  /**
   *  S2.CSS.vendorizeProperty(property) -> String
   *  - property (String): A CSS property.
   *  
   *  Converts a non-vendor-prefixed CSS property into its vendor-prefixed
   *  equivalent, if one exists.
   *  
   *  #### Examples
   *  
   *      S2.CSS.vendorizeProperty('border-radius');
   *      //-> "-moz-border-radius" (if the user is running Firefox)
   *      S2.CSS.vendorizeProperty('width'); //-> "width"
   *      S2.CSS.vendorizeProperty('narf');  //-> "narf"
   *  
  **/
  vendorizeProperty: function(property) {
    property = property.underscore().dasherize();

    if (property in S2.CSS.VENDOR.PROPERTY_MAP) {
      property = S2.CSS.VENDOR.PROPERTY_MAP[property];
    }

    return property;
  },
  
  /**
   *  S2.CSS.normalizeColor(color) -> Array
   *  - color (String): Color in #abc, #aabbcc or rgba(1,2,3) format
   *  
   *  Returns the value of a CSS color as a RGB triplet:
   *  
   *  * \#abc       -> [170, 187, 204]
   *  * \#aabbcc    -> not changed
   *  * rgb(1,2,3)  -> [1, 2, 3]
   *  * \#xyz       -> [NaN, NaN, NaN]
   *  
   *  This method does not support HTML color constants.
  **/
  normalizeColor: function(color) {
    if (!color || color == 'rgba(0, 0, 0, 0)' || color == 'transparent') color = '#ffffff';
    color = S2.CSS.colorFromString(color);
    return [
      parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)
    ];
  },

  /**
   *  S2.CSS.colorFromString(color) -> String
   *  - color (String): Color in #abc, #aabbcc or rgba(1,2,3) format
   *
   *  Returns a normalized color in the #aabbcc format.
   *
   *  * \#abc -> Expanded to #aabbcc
   *  * \#aabbcc -> not changed
   *  * rgb(1,2,3) -> Expanded to \#010203
   *  * other input -> not changed
   *
   *  This method does not support HTML color constants.
  **/
  colorFromString: function(color) {
    var value = '#', cols, i;
    if (color.slice(0,4) == 'rgb(') {
      cols = color.slice(4,color.length-1).split(',');
      i=3; while(i--) value += parseInt(cols[2-i]).toColorPart();
    } else if (color.slice(0,1) == '#') {
        if (color.length==4) for(i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();
        if (color.length==7) value = color.toLowerCase();
    } else { value = color; }
    return (value.length==7 ? value : (arguments[1] || value));
  },

  /**
   *  S2.CSS.interpolateColor(from, to, position) -> String
   *  - from (String): Original color in #abc, #aabbcc or rgba(1,2,3) format
   *  - to (String): Target color in #abc, #aabbcc or rgba(1,2,3) format
   *  - position (Number): interpolation position between 0 (original) and 1 (target)
   *  
   *  Returns a color in #aabbcc format for an arbitrary position between two colors. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      S2.CSS.interpolateColor('#ffffff', '#000000', 0.5) -> '#808080'
   *  
   *  This method does not support HTML color constants as input values.
  **/
  interpolateColor: function(from, to, position){
    from = S2.CSS.normalizeColor(from);
    to = S2.CSS.normalizeColor(to);
    
    return '#' + [0,1,2].map(function(index){ 
      return Math.max(Math.min(from[index].tween(to[index], position).round(), 255), 0).toColorPart();
    }).join('');
  },
  
  /**
   *  S2.CSS.interpolateNumber(from, to, position) -> Number
   *  - from (Number): Original number
   *  - to (Number): Target number
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a number for an arbitrary position between two numbers. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      S2.CSS.interpolateNumber(1, 2, 0.5)  -> 1.5
   *      S2.CSS.interpolateNumber(1.5, 4.5, 0.1) -> 1.8
   *      S2.CSS.interpolateNumber(1, 10, 2)   -> 3
   *      S2.CSS.interpolateNumber(1, 2, -0.5) -> 0.5
  **/
  interpolateNumber: function(from, to, position){
    return 1*((from||0).tween(to, position).toFixed(3));
  },

  /**
   *  S2.CSS.interpolateLength(from, to, position) -> String
   *  - from (Number): Original CSS length
   *  - to (Number): Target CSS length (unit must be the same as in the `from` argument)
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a CSS length for an arbitrary position between two CSS lengths. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      S2.CSS.interpolateLength('12px','18px',0.5)-> '15px'
   *      S2.CSS.interpolateLength('10%','30%',0.7) -> '24%'
  **/
  interpolateLength: function(from, to, position){
    // Firefox will give '0pt' for a computed '0' value. Ensure units match.
    if (!from || parseFloat(from) === 0) {
      from = '0' + to.gsub(S2.CSS.NUMBER,'');
    }
    to.scan(S2.CSS.NUMBER, function(match){ to = 1*(match[1]); });
    return from.gsub(S2.CSS.NUMBER, function(match){
      return (1*(parseFloat(match[1]).tween(to, position).toFixed(3))).toString();
    });
  },
  
  /**
   *  S2.CSS.interpolateInteger(from, to, position) -> Number
   *  - from (Number): Original number
   *  - to (Number): Target number
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns a number rounded to the next integer for an arbitrary position between two numbers. 
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      S2.CSS.interpolateInteger(1, 5, 0.5);  -> 3
   *      S2.CSS.interpolateInteger(2, 4, 0.1);  -> 2
   *      S2.CSS.interpolateInteger(1, 10, 2);   -> 19
   *      S2.CSS.interpolateInteger(1, 2, -0.5); -> 1
  **/
  interpolateInteger: function(from, to, position){
    return parseInt(from).tween(to, position).round();
  },
  
  /**
   *  S2.CSS.interpolate(property, from, to, position) -> Number | String
   *  - property (String): CSS property name to interpolate (e.g. 'font-size')
   *  - from (String | Number): Original value
   *  - to (String | Number): Target value
   *  - position (Number): interpolation position between 0 (original) and 1 (destination)
   *  
   *  Returns the value for an arbitrary position between two CSS property values. 
   *  The type of interpolation will be automatically choosen based on the the CSS property.
   *  Positions less then 0 and greater than 1 are possible.
   *  
   *      S2.CSS.interpolate('font-size', '14px', '18px', 0.5) -> '16px'
   *      S2.CSS.interpolate('background-color', '#abc', '#def', 0.5) -> '#c4d5e6'
   *      S2.CSS.interpolate('opacity', 1, 0, 0.75) -> 0.25
   *      S2.CSS.interpolate('zIndex', 1, 10, 0.75) -> 8
   *
   *  To generate a list of supported CSS properties and types, use:
   *
   *      $H(S2.CSS.PROPERTY_MAP).map(function(v){
   *        return v[0].underscore().dasherize(r)+' ('+v[1]+')';
   *      }).join(', ');
  **/
  interpolate: function(property, from, to, position){
    return S2.CSS['interpolate'+S2.CSS.PROPERTY_MAP[property.camelize()].capitalize()](from, to, position);
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
      return S2.CSS.PROPERTIES.inject({ }, function(styles, property) {
        styles[property] = css[property];
        return styles;
      });
    }
  }
};

S2.CSS.PROPERTIES = [];
for (var property in S2.CSS.PROPERTY_MAP) S2.CSS.PROPERTIES.push(property);

S2.CSS.NUMERIC_PROPERTIES = S2.CSS.PROPERTIES.findAll(function(property){ return !property.endsWith('olor') });
S2.CSS.COLOR_PROPERTIES   = S2.CSS.PROPERTIES.findAll(function(property){ return property.endsWith('olor') });

if (!(document.defaultView && document.defaultView.getComputedStyle)) {
  S2.CSS.ElementMethods.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = S2.CSS.PROPERTIES.inject({ }, function(hash, property) {
      hash[property] = css[property];
      return hash;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
};

Element.addMethods(S2.CSS.ElementMethods);

(function() {
  var div = document.createElement('div');  
  var style = div.style, prefix = null;
  var edgeCases = S2.CSS.VENDOR.LOOKUP_EDGE_CASES;
  var uncamelize = function(prop, prefix) {
    if (prefix) {
      prop = '-' + prefix.toLowerCase() + '-' + uncamelize(prop);
    }
    return prop.underscore().dasherize();
  }
    
  S2.CSS.VENDOR.LOOKUP_PROPERTIES.each(function(prop) {
    if (!prefix) { // We attempt to detect a prefix
      prefix = S2.CSS.VENDOR.LOOKUP_PREFIXES.detect( function(p) {
        return !Object.isUndefined(style[p + prop]);
      });
    }
    if (prefix) { // If we detected a prefix
      if ((prefix + prop) in style) {
        S2.CSS.VENDOR.PROPERTY_MAP[uncamelize(prop)] = uncamelize(prop, prefix);
      } else if (prop in edgeCases && (prefix + edgeCases[prop]) in style) {
        S2.CSS.VENDOR.PROPERTY_MAP[uncamelize(prop)] = uncamelize(edgeCases[prop], prefix);
      }
    }
  });
  
  S2.CSS.VENDOR.PREFIX = prefix;
  
  div = null;
})();
