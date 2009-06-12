//= require "license"

/**
 *  == Misc ==
 * Everything that's not part of any of the big functional groups in scripty2 belongs in here.
**/

/** section: Misc
 * s2
 * The s2 namespace is the main container for the various scripty2 frameworks
 * and also provides the libraries' version number and information about extensions.
**/
var s2 = {
  /**
   * s2.Version = '<%= SCRIPTY2_VERSION %>'
   * 
   * This contants lists the version of scripty2.
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