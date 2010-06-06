/** section: scripty2 ui
 *  class S2.UI.Behavior.Hover < S2.UI.Behavior
 *  
 *  Applies a hover behavior. Adds a `ui-state-hover` class to any 
 *  non-disabled element when hovered over.
**/
S2.UI.Behavior.Hover = Class.create(S2.UI.Behavior, {
  onmouseenter: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.addClassName('ui-state-hover');
  },
  
  onmouseleave: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.removeClassName('ui-state-hover');
  }
});