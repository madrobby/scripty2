
Object.extend(S2.UI, {
  /**
   *  S2.UI.addClassNames(elements, classNames) -> [Element...]
   *  - elements (Element | Array): An element (or collection of elements).
   *  - classNames (String | Array): A space-separated string (or array) of
   *    class names to add.
   *  
   *  Adds the class names to each of the given elements.
  **/
  addClassNames: function(elements, classNames) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }
    
    if (Object.isString(classNames)) {
      classNames = classNames.split(' ');
    }
    
    var j, className;
    for (var i = 0, element; element = elements[i]; i++) {
      for (j = 0; className = classNames[j]; j++) {
        Element.addClassName(element, className);
      }
    }
    
    return elements;
  },
  
  /**
   *  S2.UI.removeClassNames(elements, classNames) -> [Element...]
   *  - elements (Element | Array): An element (or collection of elements).
   *  - classNames (String | Array): A space-separated string (or array) of
   *    class names to remove.
   *  
   *  Removes the class names from each of the given elements.
  **/
  removeClassNames: function(elements, classNames) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }
    
    if (Object.isString(classNames)) {
      classNames = classNames.split(' ');
    }
    
    var j, className;
    for (var i = 0, element; element = elements[i]; i++) {
      for (j = 0; className = classNames[j]; j++) {
        Element.removeClassName(element, className);
      }
    }
  },

  /**
   *  S2.UI.FOCUSABLE_ELEMENTS = Array
   *  A list of tag names representing elements that are (typically)
   *  focusable. Used by [[S2.UI.isFocusable]].
  **/
  FOCUSABLE_ELEMENTS: $w('input select textarea button object'),
  
  /**
   *  S2.UI.isFocusable(element) -> Boolean
   *  - element (Element): An element.
   *  Tests whether the element is focusable. Will return `true` if the
   *  element is one of the commonly focusable kinds (and is not disabled) --
   *  _or_ if the element has had a `tabIndex` attribute set.
  **/
  // Adapted from jQuery UI.
  isFocusable: function(element) {
    var name = element.nodeName.toLowerCase(),
     tabIndex = element.readAttribute('tabIndex'),
     isFocusable = false;
    
    if (S2.UI.FOCUSABLE_ELEMENTS.include(name)) {
      isFocusable = !element.disabled;
    } else if (name === 'a' || name === 'area') {
      isFocusable = element.href || (tabIndex && !isNaN(tabIndex));
    } else {
      isFocusable = tabIndex && !isNaN(tabIndex);
    }
    return !!isFocusable && S2.UI.isVisible(element);
  },
  
  
  /**
   *  S2.UI.makeFocusable(elements, bool) -> undefined
   *  - elements (Element | Array): An element (or collection of elements).
   *  - shouldBeFocusable (Boolean): Whether the elements should be
   *    focusable.
   *  
   *  Alters the focusability of the element(s).
  **/
  makeFocusable: function(elements, shouldBeFocusable) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }
    
    var value = shouldBeFocusable ? '0' : '-1';
    for (var i = 0, element; element = elements[i]; i++) {
      $(element).writeAttribute('tabIndex', value);
    }
  },

  /**
   *  S2.UI.findFocusables(element) -> [Element...]
   *  
   *  Given an element, returns all focusable descendants.
  **/
  findFocusables: function(element) {
    return $(element).descendants().select(S2.UI.isFocusable);
  },
    
  /**
   *  S2.UI.isVisible(element) -> Boolean
   *  
   *  Tests whether the element is visible. _Does not test_ whether the
   *  element is within the viewport -- only whether it (or any of its
   *  ancestors) is hidden via CSS.
  **/
  isVisible: function(element) {
    element = $(element);
    var originalElement = element;
    
    while (element && element.parentNode) {
      var display = element.getStyle('display'),
       visibility = element.getStyle('visibility');
      
      if (display === 'none' || visibility === 'hidden') {
        return false;
      }
      element = $(element.parentNode);
    }
    return true;
  },
  
  /**
   *  S2.UI.makeVisible(elements, shouldBeVisible) -> [Element...]
   *  - elements (Element | Array): An element (or collection of elements).
   *  - shouldBeVisible (Boolean): Whether the given element(s) should be
   *    visible.
  **/
  makeVisible: function(elements, shouldBeVisible) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }
    
    var newValue = shouldBeVisible ? "visible": "hidden";
    for (var i = 0, element; element = elements[i]; i++) {
      element.setStyle({ 'visibility': newValue });
    }
    
    return elements;
  },
  
  /**
   *  S2.UI.modifierUsed(event) -> Boolean
   *  
   *  Given an event, returns `true` if at least one modifier key was pressed
   *  during the event. <kbd>Ctrl</kbd>, <kbd>Alt</kbd>, and
   *  <kbd>Command</kbd> (on the Mac) are considered modifier keys.
   *  
   *  For the purposes of this function, `SHIFT` is _not_ considered a
   *  modifier key, because of commons shortcuts like `SHIFT + TAB`.
  **/
  modifierUsed: function(event) {
    return event.metaKey || event.ctrlKey || event.altKey;
  },
  
  /**
   *  S2.UI.getText(element) -> String
   *  
   *  Returns the text content of an element.
  **/
  getText: function(element) {
    element = $(element);
    return element.innerText && !window.opera ? element.innerText :
     element.innerHTML.stripScripts().unescapeHTML().replace(/[\n\r\s]+/g, ' ');
  }
});

(function() {
  var IGNORED_ELEMENTS = [];
  function _textSelectionHandler(event) {
    var element = Event.element(event);
    if (!element) return;
    for (var i = 0, node; node = IGNORED_ELEMENTS[i]; i++) {
      if (element === node || element.descendantOf(node)) {
        Event.stop(event);
        break;
      }
    }
  }
  
  if (document.attachEvent) {
    document.onselectstart = _textSelectionHandler.bindAsEventListener(window);    
  } else {
    //document.observe('mousedown', _textSelectionHandler);
  }

  Object.extend(S2.UI, {
    /**
     *  S2.UI.enableTextSelection(element) -> Element
     *  
     *  Enables text selection within the element.
    **/
    enableTextSelection: function(element) {
      element.setStyle({
        '-moz-user-select': '',
        '-webkit-user-select': '',
        'user-select': ''
      });
      IGNORED_ELEMENTS = IGNORED_ELEMENTS.without(element);
      return element;
    },
    
    /**
     *  S2.UI.disableTextSelection(element) -> Element
     *  
     *  Disables text selection within the element.
    **/
    disableTextSelection: function(element) {
      element.setStyle({
        '-moz-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': ''
      });
      if (!IGNORED_ELEMENTS.include(element)) {
        IGNORED_ELEMENTS.push(element);              
      }
      return element;
    }
  });
})();