Effect.Operators.Style = Class.create(Effect.Operators.Base, {
  initialize: function($super, object, options) {
    $super(object, options);
    this.element = $(this.object);
    
    if (!this.options.propertyTransitions)
      this.options.propertyTransitions = { }
    else
      for (property in this.options.propertyTransitions)
        this.options.propertyTransitions[property] =
          Object.propertize(this.options.propertyTransitions[property], Effect.Transitions);
    
    if (!Object.isString(this.options.style)) {
      this.style = $H(this.options.style);

    } else {
      if (this.options.style.include(':')) {
        this.style = $H(CSS.parseStyle(this.options.style));
        
      } else {
        this.element.addClassName(options.style);
        this.style = $H(this.element.getStyles());
        this.element.removeClassName(options.style);
        
        var css = this.element.getStyles();
        this.style = this.style.reject(function(style) { return style.value == css[style.key] });
      }
    }
        
    this.tweens = this.style.map(function(pair) {
      var property = pair[0].camelize(), target = pair[1], unit = '', tween, 
        source = this.element.getStyle(property);
        
      if (CSS.COLOR_PROPERTIES.include(property)) {
        if (source == target) return;
        source = CSS.Color.normalize(source);
        target = CSS.Color.normalize(target); unit = 'color';    
        tween = function(currentStyle, style, position) {
          position = (this.options.propertyTransitions[property] || Effect.Transitions.linear)(position);
          var value = '#' + [0,1,2].map(function(index){ 
            return source[index].tween(target[index], position).round().toColorPart();
          }).join('');
          if (currentStyle[property] != value) style[property] = value;
        }.bind(this);
      } else {
        if (CSS.LENGTH.test(target)) {
          var components = target.match(/^([\+\-]?[0-9\.]+)(.*)$/);
          target = components[1];
          unit = String.interpret((components.length == 3) ? components[2] : null);
        }
        source = parseFloat(source); target = parseFloat(target); 
        if (isNaN(source) || isNaN(target) || source == target) return;
        tween = function(currentStyle, style, position) {
          position = (this.options.propertyTransitions[property] || Effect.Transitions.linear)(position);
          var value = source.tween(target, position)[unit == 'px' ? 'round' : 'toFixed'](3) + unit;
          if (currentStyle[property] != value) style[property] = value;
        }.bind(this);
      }
      return tween;
    }.bind(this)).compact();
  },
  
  valueAt: function(position) {
    var style = { }, currentStyle = this.currentStyle || { };
    this.tweens.each( function(tween){ 
      tween(currentStyle, style, position) 
    });
    return style;
  },
  
  applyValue: function(value) {
    this.element.setStyle(value);
    this.currentStyle = value;
  }
});