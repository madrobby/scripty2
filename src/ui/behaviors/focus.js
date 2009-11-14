/** section: scripty2 ui
 *  class S2.UI.Behavior.Focus < S2.UI.Behavior
 *  
 *  Applies a focus behavior. Adds a `ui-state-focus` class to any
 *  non-disabled element when focused.
**/
S2.UI.Behavior.Focus = Class.create(S2.UI.Behavior, {
  onfocus: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.addClassName('ui-state-focus');
  },
  
  onblur: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.removeClassName('ui-state-focus');
  }
});