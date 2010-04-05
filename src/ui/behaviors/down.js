/** section: scripty2 ui
 *  class S2.UI.Behavior.Down < S2.UI.Behavior
 *  
 *  Applies a down-state behavior. Adds a `ui-state-down` class to any 
 *  non-disabled element on mousedown, removing it on mouseup.
 *
 *  Also applies these behaviors on keydown when the key is the space bar or
 *  the return key (since browsers differ on whether mousedown/up handlers fire
 *  in this situation).
**/
S2.UI.Behavior.Down = Class.create(S2.UI.Behavior, {
  _isRelevantKey: function(event) {
    var code = event.keyCode;
    return (code === Event.KEY_RETURN || code === Event.KEY_SPACE);
  },
  
  onkeydown: function(event) {
    if (!this._isRelevantKey(event)) return;
    this.onmousedown(event);
  },
  
  onkeyup: function(event) {
    if (!this._isRelevantKey(event)) return;
    this.onmouseup(event);
  },
  
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