(function(UI) {
  
  UI.ButtonWithMenu = Class.create(UI.Button, {
    initialize: function($super, element, options) {
      var opt = this.setOptions(options);
      $super(element, options);
      
      this.menu = new UI.Menu();
      this.element.insert({ after: this.menu });
      
      if (opt.choices) {
        opt.choices.each(this.menu.addChoice, this.menu);
      }
      
      (function() {
        var iLayout = this.element.getLayout();
        
        this.menu.setStyle({
          left: iLayout.get('left') + 'px',
          top:  (iLayout.get('top') + iLayout.get('margin-box-height')) + 'px'
        });
      }).bind(this).defer();
      
      Object.extend(this.observers, {
        clickForMenu:  this._clickForMenu.bind(this),
        onMenuOpen:    this._onMenuOpen.bind(this),
        onMenuClose:   this._onMenuClose.bind(this),
        onMenuSelect:  this._onMenuSelect.bind(this)
      });
      
      this.observe('mousedown', this.observers.clickForMenu);
      
      this.menu.observe('ui:menu:after:open',  this.observers.onMenuOpen );
      this.menu.observe('ui:menu:after:close', this.observers.onMenuClose);
      this.menu.observe('ui:menu:selected',    this.observers.onMenuSelect);
    },
    
    _clickForMenu: function(event) {
      if (this.menu.isOpen()) {
        this.menu.close();
      } else {
        this.menu.open();
      }
    },
    
    _onMenuOpen: function() {
      var menuElement = this.menu.element, buttonElement = this.toElement();
      if (!this._clickOutsideMenuObserver) {
        this._clickOutsideMenuObserver = $(document.body).on('click', function(event) {
          var el = event.element();
          if (el !== menuElement && !el.descendantOf(menuElement) &&
           el !== buttonElement && !el.descendantOf(buttonElement)) {
            this.menu.close();
          }
        }.bind(this));
      } else {
        this._clickOutsideMenuObserver.start();
      }
    },
    
    _onMenuClose: function() {
      if (this._clickOutsideMenuObserver)
        this._clickOutsideMenuObserver.stop();
    },
    
    _onMenuSelect: function(event) {
      var element = event.element();
      this.fire('ui:button:menu:selected', {
        instance: this,
        element:  event.memo.element
      });
    }
  });
  
  
  Object.extend(UI.ButtonWithMenu, {
    DEFAULT_OPTIONS: {
      icons: { primary: 'ui-icon-bullet', secondary: 'ui-icon-triangle-1-s' }
    }
  });  
  
})(S2.UI);