//= require "license"

/**
 *  == scripty2 core ==
 *
 *  Core contains various JavaScript and DOM extensions used by scripty2 fx and scripty2 ui,
 *  plus developer utility classes.
**/

/** section: scripty2 core
 * S2
 * The S2 namespace is the main container for the various scripty2 frameworks
 * and also provides the libraries' version number and information about extensions.
**/
var S2 = {
  /**
   * S2.Version = '<%= SCRIPTY2_VERSION %>'
   * 
   * This constant lists the version of scripty2.
  **/
  Version: '<%= SCRIPTY2_VERSION %>',
  
  /**
   * S2.Extensions
   *
   * Holds information about extension modules plugged into scripty2.
  **/
  Extensions: {} 
};

//= require "extensions/misc"

//= require "css"
//= require "effects"

//= require "extensions/element"
//= require "addons/helpers"
//= require "addons/zoom"