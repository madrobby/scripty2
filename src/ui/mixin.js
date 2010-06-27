/** section: scripty2 ui
 * S2.UI.Mixin
 *
 * Reusable mixins for user interface elements.
 *
 * * [[S2.UI.Mixin.Configurable]] for hassle-free blending of 
 *   default options with user-defined options. 
 * * [[S2.UI.Mixin.Trackable]]
 * * [[S2.UI.Mixin.Element]] provides convenience methods for widgets 
 *   that map easily to a single element.
 * * [[S2.UI.Mixin.Shim]] provides an implementation of a "shim" for Internet Explorer 6,
 *   to avoid rendering z-order problems on that browser.
 *
 * Mixins can be easily added to your own controls. Here is some example code from
 * [[S2.UI.Button]]:
 *
 *     S2.UI.Button = Class.create(S2.UI.Base, S2.UI.Mixin.Element, {
 *       // ...
 *     });
**/
S2.UI.Mixin = {};

//= require "mixin/configurable"
//= require "mixin/trackable"
//= require "mixin/element"

//= require "mixin/shim"