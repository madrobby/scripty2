/** section: scripty2 ui
 *  mixin S2.UI.Mixin.Element
 *  
 *  Provides a few convenience methods for widgets that map easily to a
 *  single element.
 *
 *  The following methods are mapped from Prototype's `Element` API:
 *  `observe`, `stopObserving`, `show`, `hide`, 
 *  `addClassName`, `removeClassName`, `hasClassName`, 
 *  `setStyle`, `getStyle`, `writeAttribute`, `readAttribute`,
 *  `on`, and `fire`.
 *
 *  See <a href="http://api.prototypejs.org/dom/element/">http://api.prototypejs.org/dom/element/</a> 
 *  for more information.
**/

(function() {
  var METHODS = $w('observe stopObserving show hide ' + 
   'addClassName removeClassName hasClassName setStyle getStyle' +
   'writeAttribute readAttribute fire');
  
  var E = {};
  
  METHODS.each( function(name) {
    E[name] = function() {
      var element = this.toElement();
      return element[name].apply(element, arguments);
    };
  });

  E.on = function() {
    if (!this.__observers) this.__observers = [];
    var element = this.toElement();
    var result = element.on.apply(element, arguments);
    this.__observers.push(result);
  };
  
  window.S2.UI.Mixin.Element = E;  
})();

