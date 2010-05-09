/** section: scripty2 ui
 *  mixin S2.UI.Mixin.Element
 *  
 *  Provides a few convenience methods for widgets that map easily to a
 *  single element.
**/

(function() {
  var METHODS = $w('observe stopObserving show hide ' + 
   'addClassName removeClassName hasClassName setStyle getStyle' +
   'writeAttribute readAttribute on fire');
  
  var E = {};
  
  METHODS.each( function(name) {
    E[name] = function() {
      var element = this.toElement();
      return element[name].apply(element, arguments);
    };
  });

  window.S2.UI.Mixin.Element = E;  
})();

