//= require "license"

/**
 * == scripty2 ==
 * Welcome to scripty2! At the moment this complete rewrite of the venerable script.aculo.us
 * library is a prerelease alpha version and not ment for production use (although we used it
 * in [live projects with millions of pageviews][1] and it worked great!).
 * 
 * [1]: http://twistori.com
 * 
 * scripty2 is divided into several parts, as follows.
**/

/** section: scripty2
 * s2
 * The s2 namespace is the main container for the various scripty2 frameworks
 * and also provides the libraries' version number and information about extensions.
**/
var s2 = {
  Version: '<%= SCRIPTY2_VERSION %>', 
  Extensions: {} 
};

//= require "css"
//= require "effects"
//= require "behaviours"
  
//= require "extensions/misc"
//= require "extensions/element"
//= require "addons/helpers"