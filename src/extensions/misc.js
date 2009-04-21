Function.prototype.optionize = function(){
  var self = this, argumentNames = self.argumentNames(), optionIndex = argumentNames.length - 1, 
    method = function(){
    var args = $A(arguments), options = typeof args.last() == 'object' ? args.pop() : {},
      prefilledArgs = (optionIndex == 0 ? [] : 
        ((args.length > 0 ? args : [null]).inGroupsOf(optionIndex).flatten())).concat(options);
    return self.apply(this, prefilledArgs);
  };
  method.argumentNames = function(){ return argumentNames };
  return method;
};

Number.prototype.tween = function(target, position){
  return this + (target-this) * position;
};

Object.propertize = function(property, object){
  return Object.isString(property) ? object[property] : property;
};