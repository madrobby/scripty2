
(function(UI) {  
  /** section: scripty2 ui
   *  class S2.UI.Tabs < S2.UI.Base
   *  
   *  A set of tabs.
  **/
  UI.Tabs = Class.create(UI.Base, {
    NAME: "S2.UI.Tabs",

    /**
     *  new S2.UI.Tabs(element, options)
    **/
    initialize: function(element, options) {
      this.element = $(element);
      UI.addClassNames(this.element,
       'ui-widget ui-widget-content ui-tabs ui-corner-all');

      this.setOptions(options);
      var opt = this.options;

      this.anchors = [];
      this.panels  = [];

      this.list = this.element.down('ul');
      this.list.cleanWhitespace();
      this.nav  = this.list;
      UI.addClassNames(this.nav,
       'ui-tabs-nav ui-helper-reset ui-helper-clearfix ' +
       'ui-widget-header ui-corner-all');

      this.tabs = this.list.select('li');
      UI.addClassNames(this.tabs, 'ui-state-default ui-corner-top');
      UI.addBehavior(this.tabs, [UI.Behavior.Hover, UI.Behavior.Down]);

      // ARIA.
      this.element.writeAttribute({
        'role': 'tablist',
        'aria-multiselectable': 'false'
      });
      
      // Look for an anchor inside each tab. If one exists and correlates
      // to a panel that exists in the document, add the anchor and panel
      // to their respective collections.
      this.tabs.each( function(li) {
        var anchor = li.down('a');
        if (!anchor) return;

        var href = anchor.readAttribute('href');
        if (!href.include('#')) return;

        var hash = href.split('#').last(), panel = $(hash);
        
        li.writeAttribute('tabIndex', '0');

        if (panel) {
          panel.store('ui.tab', li);
          li.store('ui.panel', panel);

          this.anchors.push(anchor);
          this.panels.push(panel);
        }
      }, this);
      
      // ARIA.
      this.anchors.invoke('writeAttribute', 'role', 'tab');
      this.panels.invoke('writeAttribute', 'role', 'tabpanel');

      this.tabs.first().addClassName('ui-position-first');
      this.tabs.last().addClassName('ui-position-last');

      UI.addClassNames(this.panels,
       'ui-tabs-panel ui-tabs-hide ui-widget-content ui-corner-bottom');

      this.observers = {
        onKeyPress: this.onKeyPress.bind(this),
        onTabClick: this.onTabClick.bind(this)
      };
      this.addObservers();

      // Figure out which tab/panel should be active.
      var selectedTab;

      // If the URL hash points to one of our panels, that's the active one.
      var urlHash = window.location.hash.substring(1), activePanel;
      if (!urlHash.empty()) {
        activePanel = $(urlHash);
      }
      if (activePanel && this.panels.include(activePanel)) {
        selectedTab = activePanel.retrieve('ui.tab');
      } else {
        // If not, we defer to the options, or otherwise the first tab.
        selectedTab = opt.selectedTab ? $(opt.selectedTab) :
         this.tabs.first();
      }

      this.setSelectedTab(selectedTab);
    },

    addObservers: function() {
      this.anchors.invoke('observe', 'click', this.observers.onTabClick);
      this.tabs.invoke('observe', 'keypress', this.observers.onKeyPress);
    },

    _setSelected: function(id) {
      var panel = $(id), tab = panel.retrieve('ui.tab');

      var oldTab = this.list.down('.ui-tabs-selected');
      var oldPanel = oldTab ? oldTab.retrieve('ui.panel') : null;

      // Set the active tab.
      UI.removeClassNames(this.tabs, 'ui-tabs-selected ui-state-active');
      UI.addClassNames(this.tabs, 'ui-state-default');

      tab.removeClassName('ui-state-default').addClassName(
       'ui-tabs-selected ui-state-active');

      // Set the active panel.
      this.element.fire('ui:tabs:change', {
        from: { tab: oldTab, panel: oldPanel },
        to:   { tab: tab,    panel: panel    }
      });
      this.options.panel.transition(oldPanel, panel);
    },

    /**
     *  S2.UI.Tabs#setSelectedTab(tab) -> undefined
     *  - tab (Element): The tab to make active.
    **/
    setSelectedTab: function(tab) {
      this.setSelectedPanel(tab.retrieve('ui.panel'));
    },

    /**
     *  S2.UI.Tabs#setSelectedPanel(panel) -> undefined
     *  - panel (Element): The panel to make active.
    **/
    setSelectedPanel: function(panel) {
      this._setSelected(panel.readAttribute('id'));
    },

    onTabClick: function(event) {
      event.stop();
      var anchor = event.findElement('a'), tab = event.findElement('li');

      this.setSelectedTab(tab);
    },
    
    onKeyPress: function(event) {
      if (UI.modifierUsed(event)) return;      
      var tab = event.findElement('li');      
      var keyCode = event.keyCode || event.charCode;
      
      switch (keyCode) {
      case Event.KEY_SPACE:  // fallthrough
      case Event.KEY_RETURN:
        this.setSelectedTab(tab);
        event.stop();
        return;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_LEFT:
        this._focusTab(tab, -1);
        return;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_RIGHT:
        this._focusTab(tab, 1);
        return;
      }
    },
    
    _focusTab: function(tab, delta) {
      // If delta is provided, move the specified number of slots.
      if (Object.isNumber(delta)) {
        var index = this.tabs.indexOf(tab);
        index = index + delta;
        if (index > (this.tabs.length - 1)) {
          index = this.tabs.length - 1;
        } else if (index < 0) {
          index = 0;
        }
        tab = this.tabs[index];
      }
      (function() { tab.focus(); }).defer();
    }    
  });

  Object.extend(UI.Tabs, {
    DEFAULT_OPTIONS: {
      panel: {
        transition: function(from, to) {
          if (from) {
            from.addClassName('ui-tabs-hide');
          }
          to.removeClassName('ui-tabs-hide');
        }
      }
    }
  });
})(S2.UI);