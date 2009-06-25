//= require "license"

/**
 *  == scripty2 ui ==
 *  * [[s2.css]]: functions for CSS parsing, color normalization and CSS value interpolation.
**/

/**
 *  == scripty2 core ==
 *
 *  Core contains various JavaScript and DOM extensions used by [[scripty2 fx]] and [[scripty2 ui]],
 *  and developer utility classes.
**/

/** section: scripty2 core
 * s2
 * The s2 namespace is the main container for the various scripty2 frameworks
 * and also provides the libraries' version number and information about extensions.
**/
var s2 = {
  /**
   * s2.Version = '<%= SCRIPTY2_VERSION %>'
   * 
   * This constant lists the version of scripty2.
  **/
  Version: '<%= SCRIPTY2_VERSION %>',
  
  /**
   * s2.Extensions
   *
   * Holds information about extension modules plugged into scripty2. Currently unused.
  **/
  Extensions: {} 
};

//= require "css"
//= require "effects"
  
//= require "extensions/misc"
//= require "extensions/element"

//= require "addons/helpers"