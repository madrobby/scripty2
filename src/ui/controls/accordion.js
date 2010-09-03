Object.extend(Event, {
  KEY_SPACE: 32
});

(function(UI) {
  
  /** section: scripty2 ui
   *  class S2.UI.Accordion < S2.UI.Base
   *  
   *  Applies "accordion menu" behavior to an element and its contents.
   *  
   *  ##### Options
   *  
   *  * `multiple` (Boolean): Whether multiple panels can be open at once.
   *    Defaults to `false`.
   *  * `headerSelector` (String): A CSS selector that identifies the
   *    child elements to use as accordion headers. Defaults to `"h3"`.
   *  * `icons` (Object): The icons to use for each of the header states.
   *    Expects two properties &mdash; `header` and `headerSelected` &mdash;
   *    and a `String` for each. Defaults to `{ header:
   *    'ui-icon-triangle-1-e', headerSelected: 'ui-icon-triangle-1-s' }`.
   *  * `transition` (Function): A function that handles the transition
   *    effect when a panel is selected. Takes two arguments, `panel` and
   *    `previousPanel`, which reference the panel to be shown and the panel
   *    to be hidden, respectively. (When there is no panel to be hidden, the
   *    `previousPanel` argument will be `null`.) Defaults to a function that
   *    applies a "slide down"/"slide up" effect.
  **/
  UI.Accordion = Class.create(UI.Base, {
    NAME: "S2.UI.Accordion",
    
    /**
     *  new S2.UI.Accordion(element[, options])
     *  - element (Element): A container element.
     *  - options (Object): A set of options for customizing the widget.
     *  
     *  Creates an `S2.UI.Accordion`.
    **/
    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);
    
      UI.addClassNames(this.element, 'ui-accordion ui-widget ui-helper-reset');
    
      if (this.element.nodeName.toUpperCase() === "UL") {
        var lis = this.element.childElements().grep(new Selector('li'));
        UI.addClassNames(lis, 'ui-accordion-li-fix');
      }

      // Find all the headers.
      this.headers = this.element.select(opt.headerSelector);
      if (!this.headers || this.headers.length === 0) return;
    
      UI.addClassNames(this.headers, 'ui-accordion-header ui-helper-reset ' +
       'ui-state-default ui-corner-all');
      UI.addBehavior(this.headers, [UI.Behavior.Hover, UI.Behavior.Focus]);
      
      // The next sibling of each header is its corresponding content element.
      this.content = this.headers.map( function(h) { return h.next(); });
      
      UI.addClassNames(this.content, 'ui-accordion-content ui-helper-reset ' +
       'ui-widget-content ui-corner-bottom');
    
      // Append icon elements.
      this.headers.each( function(header) {
        var icon = new Element('span');
        UI.addClassNames(icon, 'ui-icon ' + opt.icons.header);
        header.insert({ top: icon });
      });

      // If the user specified an active header, mark it as active.
      // Otherwise, the first one is active by default.
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
      
      transition: function(panel, previousPanel) {
        var effects = [], effect;
        
        if (previousPanel) {
          effect = new S2.FX.SlideUp(previousPanel, {
            duration: 0.2,
            after: function() {
              previousPanel.removeClassName('ui-accordion-content-active');
            }
          });
          effects.push(effect);
        }
        
        if (panel) {
          effect = new S2.FX.SlideDown(panel, {
            duration: 0.2,
            before: function() {
              panel.addClassName('ui-accordion-content-active');
            }
          });
          effects.push(effect);
        }
        
        // TODO: Figure out why fx.Parallel isn't working.
        effects.invoke('play');       
        //new S2.fx.Parallel(effects, { duration: 0.5 }).play();
      }      
    }
  });

})(S2.UI);

