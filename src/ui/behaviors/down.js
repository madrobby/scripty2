/** section: scripty2 UI
 *  class S2.UI.Behavior.Down < UI.Behavior
 *  
 *  Applies a down-state behavior. Adds a `ui-state-down` class to any 
 *  non-disabled element on mousedown, removing it on mouseup.
**/
S2.UI.Behavior.Down = Class.create(S2.UI.Behavior, {
  onmousedown: function(event) {
    this._down = true;
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.addClassName('ui-state-down');
  },
  
  onmouseup: function(event) {
    this._down = false;
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.removeClassName('ui-state-down');
  },
  
  // Handles a specific case:
  // mouse down on button, mouse up outside of button.
  onmouseleave: function(event) {
    return this.onmouseup(event);
  },
  
  // Handles mousedown -> mouseleave -> mouseenter -> mouseup.
  onmouseenter: function(event) {
    if (this._down) {
      return this.onmousedown(event);
    }
  }
});