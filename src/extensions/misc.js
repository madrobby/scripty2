
/** section: scripty2 core
 * class Function
 *  
 *  Extensions to the built-in `Function` object.
**/

/**
 *  Function#optionize() -> Function
 *
 *  Given a function whose last parameter is an object
 *  of options, return a function that accepts a variable
 *  number of arguments and always passes the last argument
 *  that is an object to the options parameter. This way,
 *  the function can be called with just options, leaving
 *  the other parameters undefined.
 *
 *      var logOptions = function(a, b, options){
 *        console.log(options);
 *      }.optionize();
 *      logOptions({hello: "world"}) -> logs {hello: "world"}
 *      logOptions(1, {hello: "world"}) -> logs {hello: "world"}
 *      logOptions(1, 2, {hello: "world"}) -> logs {hello: "world"}
 *
 *  But note that providing too many arguments will not work:
 *
 *      logOptions(1,2,3, {hello: "world"}) -> logs 3
**/
Function.prototype.optionize = function(){
  var self = this, 
			argumentNames = self.argumentNames(),
			optionIndex = argumentNames.length - 1, 
    	method = function(){
    		var args = $A(arguments), 
						options = typeof args.last() == 'object' ? args.pop() : {},
    		  	prefilledArgs = (optionIndex == 0 ? [] : 
    		    	((args.length > 0 ? args : [null]).inGroupsOf(optionIndex).flatten())).concat(options);
    		return self.apply(this, prefilledArgs);
  		};
  method.argumentNames = function(){ return argumentNames };
  return method;
};

/** section: scripty2 core
 * class Number
 *  
 *  Extensions to the built-in `Number` object.
**/

/**
 *  Number#tween(target, position) -> Number
 *  - target (Number): tween target
 *  - position (Number): position between 0 (start of tween) and (end of tween); can also be < 0 and > 1.
 *
 *  Returns the number that is a given percentage between this number and a target number.
 *
 *      (1).tween(2, 0.5) -> 1.5
 *      (1).tween(2, 0) -> 1
 *      (1).tween(2, 1) -> 2
**/
Number.prototype.tween = function(target, position){
  return this + (target-this) * position;
};

/** section: scripty2 core
 * class Object
 *  
 *  Extensions to the built-in `Object` object.
**/

/**
 *  Object.propertize(property, object) -> Object
 *  - property (String | Object): item or name of item
 *  - object (Object): namespace in which to look for named item
 *
 *  If `property` is a string, finds it in the provided `object`.
 *  Otherwise returns `property`.
 *
 *      Object.propertize(S2.FX.Transitions.sinusoidal, S2.FX.Transitions) -> S2.FX.Transitions.sinusoidal
 *      Object.propertize('sinusoidal', S2.FX.Transitions) -> S2.FX.Transitions.sinusoidal
 *
**/
Object.propertize = function(property, object){
  return Object.isString(property) ? object[property] : property;
};