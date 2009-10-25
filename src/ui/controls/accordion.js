Object.extend(Event, {
  KEY_SPACE: 32
});

(function(UI) {
  
  /**
   *  class S2.UI.Accordion
   *  includes S2.UI.Mixin.Configurable
  **/
  UI.Accordion = Class.create(UI.Mixin.Configurable, {
    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);
    
      UI.addClassNames(this.element, 'ui-accordion ui-widget ui-helper-reset');
    
      if (this.element.nodeName.toUpperCase() === "UL") {
        var lis = this.element.childElements().grep(new Selector('li'));
        UI.addClassNames(lis, 'ui-accordion-li-fix');
      }
    
      this.headers = this.element.select(opt.headerSelector);
      if (!this.headers || this.headers.length === 0) return;
    
      UI.addClassNames(this.headers, 'ui-accordion-header ui-helper-reset ' +
       'ui-state-default ui-corner-all');
      UI.addBehavior(this.headers, [UI.Behavior.Hover, UI.Behavior.Focus]);
    
      this.content = this.headers.map( function(h) { return h.next(); });
      
      this.content.each( function(panel) {
        var styles = {
          height: panel.getStyle('height'),
          paddingTop: panel.getStyle('padding-top'),
          paddingBottom: panel.getStyle('padding-bottom')
        };
        panel.store('ui.accordion.styles', styles);
      });
      
      UI.addClassNames(this.content, 'ui-accordion-content ui-helper-reset ' +
       'ui-widget-content ui-corner-bottom');
    
      // Append icon elements.
      this.headers.each( function(header) {
        var icon = new Element('span');
        UI.addClassNames(icon, 'ui-icon ' + opt.icons.header);
        header.insert({ top: icon });
      });
    
      this._markActive(opt.active || this.headers.first(), false);
    
      // ARIA.
      this.element.writeAttribute({
        'role': 'tablist',
        'aria-multiselectable': opt.multiple.toString()
      });
      this.headers.invoke('writeAttribute', 'role', 'tab');
      this.content.invoke('writeAttribute', 'role', 'tabpanel');
    
      var links = this.headers.map( function(h) { return h.down('a'); });
      links.invoke('observe', 'click', function(event) {
        event.preventDefault();
      });
    
      this.observers = {
        click: this.click.bind(this),
        keypress: this.keypress.bind(this)
      };
    
      this.addObservers();
    },
  
    addObservers: function() {
      this.headers.invoke('observe', 'click', this.observers.click);
      if (Prototype.Browser.WebKit) {
        this.headers.invoke('observe', 'keydown', this.observers.keypress);
      } else {    
        this.headers.invoke('observe', 'keypress', this.observers.keypress);
      }
    },
  
    click: function(event) {
      var header = event.findElement(this.options.headerSelector);
      if (!header || !this.headers.include(header)) return;
      this._toggleActive(header);
    },
  
    keypress: function(event) {
      // Don't stomp on browsers' built-in keyboard shortcuts.
      if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) {
        return;        
      }
      var header = event.findElement(this.options.headerSelector);
      var keyCode = (event.keyCode === 0) ? event.charCode : event.keyCode;    
      switch (keyCode) {
      case Event.KEY_SPACE:
        this._toggleActive(header);
        event.stop();
        return;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_RIGHT:
        this._focusHeader(header, 1);
        event.stop();
        return;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_LEFT:
        this._focusHeader(header, -1);
        event.stop();
        return;
      case Event.KEY_HOME:
        this._focusHeader(this.headers.first());
        event.stop();
        return;
      case Event.KEY_END:
        this._focusHeader(this.headers.last());
        event.stop();
        return;
      }
    },
  
    _focusHeader: function(header, delta) {
      // If delta is provided, move the specified number of slots.
      if (Object.isNumber(delta)) {
        var index = this.headers.indexOf(header);
        index = index + delta;
        if (index > (this.headers.length - 1)) {
          index = this.headers.length - 1;
        } else if (index < 0) {
          index = 0;
        }
        header = this.headers[index];
      }
      (function() { header.down('a').focus(); }).defer();
    },
  
    _toggleActive: function(header) {
      if (header.hasClassName('ui-state-active')) {
        // If multiple expansion is disabled, the only way to hide one panel is
        // to click on another.
        if (!this.options.multiple) return;
        this._removeActive(header);
        this._activatePanel(null, header.next(), true);
      } else {
        this._markActive(header);
      }
    },
  
    _removeActive: function(active) {
      var opt = this.options;
      UI.removeClassNames(active, 'ui-state-active ui-corner-top');
      UI.addClassNames(active, 'ui-state-default ui-corner-all');
      active.writeAttribute('aria-expanded', 'false');
      
      var icon = active.down('.ui-icon');
      icon.removeClassName(opt.icons.headerSelected);
      icon.addClassName(opt.icons.header);
    },
  
    _markActive: function(active, shouldAnimate) { 
      if (Object.isUndefined(shouldAnimate)) {
        shouldAnimate = true;
      }
      var opt = this.options;
      
      var activePanel = null;
      if (!opt.multiple) {
        activePanel = this.element.down('.ui-accordion-content-active');
        this.headers.each(this._removeActive.bind(this));
      }
    
      if (!active) return;
    
      UI.removeClassNames(active, 'ui-state-default ui-corner-all');
      UI.addClassNames(active, 'ui-state-active ui-corner-top');

      active.writeAttribute('aria-expanded', 'true');
      
      this._activatePanel(active.next(), activePanel, shouldAnimate);

      var icon = active.down('.ui-icon');
      icon.removeClassName(opt.icons.header);
      icon.addClassName(opt.icons.headerSelected);
    
      return active;
    },
    
    _activatePanel: function(panel, previousPanel, shouldAnimate) {
      if (shouldAnimate) {
        this.options.transition(panel, previousPanel);
      } else {
        if (previousPanel) {
          previousPanel.removeClassName('ui-accordion-content-active');
        }
        if (panel) {
          panel.addClassName('ui-accordion-content-active');
        }
      }
    }
  });

  Object.extend(UI.Accordion, {
    DEFAULT_OPTIONS: {
      multiple: false,  /* whether more than one pane can be open at once */    
      headerSelector: 'h3',
    
      icons: {
        header:         'ui-icon-triangle-1-e',
        headerSelected: 'ui-icon-triangle-1-s'
      },
      
      // TODO: Simplify and extract this into a generic SlideDown effect.
      transition: function(panel, previousPanel) {
        var effects = [];
        
        if (previousPanel) {
          var previousEffect = new S2.fx.Morph(previousPanel, {
            duration: 0.2,
            style: 'height: 0; padding-top: 0; padding-bottom: 0',
            before: function() {
              previousPanel.setStyle({ overflow: 'hidden' });
            },
            after: function() {
              previousPanel.removeClassName('ui-accordion-content-active');
              previousPanel.setStyle({
                height: '',
                paddingTop: '',
                paddingBottom: '',
                overflow: 'visible'
              });
            }
          });          
          effects.push(previousEffect);
        }
        
        if (panel) {
          var totalHeight = panel.getHeight(),
           pTop = window.parseInt(panel.getStyle('padding-top'), 10),
           pBottom = window.parseInt(panel.getStyle('padding-bottom'), 10);

          var height = totalHeight - pTop - pBottom;

          var css = 'height: #{0}px; padding-top: #{1}px; padding-bottom: #{2}px'.interpolate([height, pTop, pBottom]);

          var panelEffect = new S2.fx.Morph(panel, {
            duration: 0.2,
            style: css,
            before: function() {
              panel.setStyle({
                height: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                overflow: 'hidden'
              });
              panel.addClassName('ui-accordion-content-active');
            },
            after: function() {
              panel.setStyle({
                height: '',
                paddingTop: '',
                paddingBottom: '',
                overflow: 'visible'
              });
            }
          });

          effects.push(panelEffect);    
        }
    
        
        // TODO: Figure out why fx.Parallel isn't working.
        effects.invoke('play');       
        //new S2.fx.Parallel(effects, { duration: 0.5 }).play();
      }      
    }
  });

})(S2.UI);

