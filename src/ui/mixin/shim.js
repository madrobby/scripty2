/** section: scripty2 ui
 *  mixin S2.UI.Mixin.Shim
**/
S2.UI.Mixin.Shim = {
  __SHIM_TEMPLATE: new Template(
    "<iframe frameborder='0' tabindex='-1' src='javascript:false;' " +
      "style='display:block;position:absolute;z-index:-1;overflow:hidden; " +
      "filter:Alpha(Opacity=\"0\");" +
      "top:expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\');" +
       "left:expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\');" +
       "width:expression(this.parentNode.offsetWidth+\'px\');" + 
       "height:expression(this.parentNode.offsetHeight+\'px\');" +
    "' id='#{0}'></iframe>"
  ),
  
  /**
   *  S2.UI.Mixin.Shim#createShim([element]) -> undefined
   *  - element (Element): Optional element to shim. If omitted, will assume
   *    `this.element`.
   * 
   *  Create an IFRAME "shim" underneath the positioned element.
   *  
   *  Needed for IE6, which otherwise shows some UI controls (like SELECT
   *  boxes) _above_ an element, regardless of its CSS z-index.
   *  
   *  Does nothing in other browsers.
  **/
  createShim: function(element) {
    // Only needed for IE 6.
    this.__shim_isie6 = (Prototype.Browser.IE && 
     (/6.0/).test(navigator.userAgent));
    if (!this.__shim_isie6) return;
    
    element = $(element || this.element);
    if (!element) return;
    
    // The element we're sticking a shim underneath.
    this.__shimmed = element;
    
    var id = element.identify() + '_iframeshim', shim = $(id);
    
    // Clean up any shim that may exist already.
    if (shim) shim.remove();

    element.insert({
      top: this.__SHIM_TEMPLATE.evaluate([id])
    });

    this.__shim_id = id;
  },
  
  /**
   *  S2.UI.Mixin.Shim.adjustShim() -> undefined
   *  
   *  Reposition the shim, copying the dimensions and offsets of the target
   *  element.
   *  
   *  Note that the [[S2.UI.Mixin.Shim]] mixin _attempts_ to do this 
   *  automatically by using IE6's proprietary CSS expressions. But because
   *  such expressions can sometimes fail to update promptly, calling this
   *  method yourself may be necessary.
   *  
   *  Once you've called `adjustShim`, the shim loses the ability to
   *  dynamically update its position on its own. Subsequently, you'll have
   *  to call `adjustShim` again each time you update the element's layout.
  **/
  adjustShim: function() {
    if (!this.__shim_isie6) return;
    var shim = this.__shimmed.down('iframe#' + this.__shim_id);
    var element = this.__shimmed;
    if (!shim) return;
    
    shim.setStyle({
      width:  element.offsetWidth  + 'px',
      height: element.offsetHeight + 'px'
    });
  },
  
  /**
   *  S2.UI.Mixin.Shim#destroyShim() -> undefined
   *  
   *  Removes the shim.
  **/
  destroyShim: function() {
    if (!this.__shim_isie6) return;
    var shim = this.__shimmed.down('iframe#' + this.__shim_id);
    if (shim) {
      shim.remove();
    }
    
    this.__shimmed = null;
  }
};