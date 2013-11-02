/*  Prototype JavaScript framework, version 1.7_rc2
 *  (c) 2005-2010 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

var Prototype = {

  Version: '1.7_rc2',

  Browser: (function(){
    var ua = navigator.userAgent;
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
    return {
      IE:             !!window.attachEvent && !isOpera,
      Opera:          isOpera,
      WebKit:         ua.indexOf('AppleWebKit/') > -1,
      Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
      MobileSafari:   /Apple.*Mobile/.test(ua)
    }
  })(),

  BrowserFeatures: {
    XPath: !!document.evaluate,

    SelectorsAPI: !!document.querySelector,

    ElementExtensions: (function() {
      var constructor = window.Element || window.HTMLElement;
      return !!(constructor && constructor.prototype);
    })(),
    SpecificElementExtensions: (function() {
      if (typeof window.HTMLDivElement !== 'undefined')
        return true;

      var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

      if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
        isSupported = true;
      }

      div = form = null;

      return isSupported;
    })()
  },

  ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
  JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

  emptyFunction: function() { },

  K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
  Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = { };


var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) { }
    }

    return returnValue;
  }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = Prototype.emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
        var method = value;
        value = (function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property).wrap(method);

        value.valueOf = method.valueOf.bind(method);
        value.toString = method.toString.bind(method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();
(function() {

  var _toString = Object.prototype.toString,
      NULL_TYPE = 'Null',
      UNDEFINED_TYPE = 'Undefined',
      BOOLEAN_TYPE = 'Boolean',
      NUMBER_TYPE = 'Number',
      STRING_TYPE = 'String',
      OBJECT_TYPE = 'Object',
      BOOLEAN_CLASS = '[object Boolean]',
      NUMBER_CLASS = '[object Number]',
      STRING_CLASS = '[object String]',
      ARRAY_CLASS = '[object Array]',
      NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON &&
        typeof JSON.stringify === 'function' &&
        JSON.stringify(0) === '0' &&
        typeof JSON.stringify(Prototype.K) === 'undefined';

  function Type(o) {
    switch(o) {
      case null: return NULL_TYPE;
      case (void 0): return UNDEFINED_TYPE;
    }
    var type = typeof o;
    switch(type) {
      case 'boolean': return BOOLEAN_TYPE;
      case 'number':  return NUMBER_TYPE;
      case 'string':  return STRING_TYPE;
    }
    return OBJECT_TYPE;
  }

  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }

  function inspect(object) {
    try {
      if (isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  }

  function toJSON(value) {
    return Str('', { '': value }, []);
  }

  function Str(key, holder, stack) {
    var value = holder[key],
        type = typeof value;

    if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    var _class = _toString.call(value);

    switch (_class) {
      case NUMBER_CLASS:
      case BOOLEAN_CLASS:
      case STRING_CLASS:
        value = value.valueOf();
    }

    switch (value) {
      case null: return 'null';
      case true: return 'true';
      case false: return 'false';
    }

    type = typeof value;
    switch (type) {
      case 'string':
        return value.inspect(true);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'object':

        for (var i = 0, length = stack.length; i < length; i++) {
          if (stack[i] === value) { throw new TypeError(); }
        }
        stack.push(value);

        var partial = [];
        if (_class === ARRAY_CLASS) {
          for (var i = 0, length = value.length; i < length; i++) {
            var str = Str(i, value, stack);
            partial.push(typeof str === 'undefined' ? 'null' : str);
          }
          partial = '[' + partial.join(',') + ']';
        } else {
          var keys = Object.keys(value);
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i], str = Str(key, value, stack);
            if (typeof str !== "undefined") {
               partial.push(key.inspect(true)+ ':' + str);
             }
          }
          partial = '{' + partial.join(',') + '}';
        }
        stack.pop();
        return partial;
    }
  }

  function stringify(object) {
    return JSON.stringify(object);
  }

  function toQueryString(object) {
    return $H(object).toQueryString();
  }

  function toHTML(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  }

  function keys(object) {
    if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
    var results = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        results.push(property);
      }
    }
    return results;
  }

  function values(object) {
    var results = [];
    for (var property in object)
      results.push(object[property]);
    return results;
  }

  function clone(object) {
    return extend({ }, object);
  }

  function isElement(object) {
    return !!(object && object.nodeType == 1);
  }

  function isArray(object) {
    return _toString.call(object) === ARRAY_CLASS;
  }

  var hasNativeIsArray = (typeof Array.isArray == 'function')
    && Array.isArray([]) && !Array.isArray({});

  if (hasNativeIsArray) {
    isArray = Array.isArray;
  }

  function isHash(object) {
    return object instanceof Hash;
  }

  function isFunction(object) {
    return typeof object === "function";
  }

  function isString(object) {
    return _toString.call(object) === STRING_CLASS;
  }

  function isNumber(object) {
    return _toString.call(object) === NUMBER_CLASS;
  }

  function isUndefined(object) {
    return typeof object === "undefined";
  }

  extend(Object, {
    extend:        extend,
    inspect:       inspect,
    toJSON:        NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
    toQueryString: toQueryString,
    toHTML:        toHTML,
    keys:          Object.keys || keys,
    values:        values,
    clone:         clone,
    isElement:     isElement,
    isArray:       isArray,
    isHash:        isHash,
    isFunction:    isFunction,
    isString:      isString,
    isNumber:      isNumber,
    isUndefined:   isUndefined
  });
})();
Object.extend(Function.prototype, (function() {
  var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

  function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

  function argumentNames() {
    var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  }

  function bind(context) {
    if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
    var __method = this, args = slice.call(arguments, 1);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(context, a);
    }
  }

  function bindAsEventListener(context) {
    var __method = this, args = slice.call(arguments, 1);
    return function(event) {
      var a = update([event || window.event], args);
      return __method.apply(context, a);
    }
  }

  function curry() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

  function delay(timeout) {
    var __method = this, args = slice.call(arguments, 1);
    timeout = timeout * 1000;
    return window.setTimeout(function() {
      return __method.apply(__method, args);
    }, timeout);
  }

  function defer() {
    var args = update([0.01], arguments);
    return this.delay.apply(this, args);
  }

  function wrap(wrapper) {
    var __method = this;
    return function() {
      var a = update([__method.bind(this)], arguments);
      return wrapper.apply(this, a);
    }
  }

  function methodize() {
    if (this._methodized) return this._methodized;
    var __method = this;
    return this._methodized = function() {
      var a = update([this], arguments);
      return __method.apply(null, a);
    };
  }

  return {
    argumentNames:       argumentNames,
    bind:                bind,
    bindAsEventListener: bindAsEventListener,
    curry:               curry,
    delay:               delay,
    defer:               defer,
    wrap:                wrap,
    methodize:           methodize
  }
})());



(function(proto) {


  function toISOString() {
    return this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z';
  }


  function toJSON() {
    return this.toISOString();
  }

  if (!proto.toISOString) proto.toISOString = toISOString;
  if (!proto.toJSON) proto.toJSON = toJSON;

})(Date.prototype);


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
        this.currentlyExecuting = false;
      } catch(e) {
        this.currentlyExecuting = false;
        throw e;
      }
    }
  }
});
Object.extend(String, {
  interpret: function(value) {
    return value == null ? '' : String(value);
  },
  specialChar: {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '\\': '\\\\'
  }
});

Object.extend(String.prototype, (function() {
  var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
    typeof JSON.parse === 'function' &&
    JSON.parse('{"test": true}').test;

  function prepareReplacement(replacement) {
    if (Object.isFunction(replacement)) return replacement;
    var template = new Template(replacement);
    return function(match) { return template.evaluate(match) };
  }

  function gsub(pattern, replacement) {
    var result = '', source = this, match;
    replacement = prepareReplacement(replacement);

    if (Object.isString(pattern))
      pattern = RegExp.escape(pattern);

    if (!(pattern.length || pattern.source)) {
      replacement = replacement('');
      return replacement + source.split('').join(replacement) + replacement;
    }

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  }

  function sub(pattern, replacement, count) {
    replacement = prepareReplacement(replacement);
    count = Object.isUndefined(count) ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  }

  function scan(pattern, iterator) {
    this.gsub(pattern, iterator);
    return String(this);
  }

  function truncate(length, truncation) {
    length = length || 30;
    truncation = Object.isUndefined(truncation) ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  }

  function strip() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function stripTags() {
    return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
  }

  function stripScripts() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  }

  function extractScripts() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  }

  function evalScripts() {
    return this.extractScripts().map(function(script) { return eval(script) });
  }

  function escapeHTML() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function unescapeHTML() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }


  function toQueryParams(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  }

  function toArray() {
    return this.split('');
  }

  function succ() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  }

  function times(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  }

  function camelize() {
    return this.replace(/-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }

  function capitalize() {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  }

  function underscore() {
    return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
  }

  function dasherize() {
    return this.replace(/_/g, '-');
  }

  function inspect(useDoubleQuotes) {
    var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
      if (character in String.specialChar) {
        return String.specialChar[character];
      }
      return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
    });
    if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
    return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }

  function unfilterJSON(filter) {
    return this.replace(filter || Prototype.JSONFilter, '$1');
  }

  function isJSON() {
    var str = this;
    if (str.blank()) return false;
    str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
    str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
    return (/^[\],:{}\s]*$/).test(str);
  }

  function evalJSON(sanitize) {
    var json = this.unfilterJSON(),
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    if (cx.test(json)) {
      json = json.replace(cx, function (a) {
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      });
    }
    try {
      if (!sanitize || json.isJSON()) return eval('(' + json + ')');
    } catch (e) { }
    throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
  }

  function parseJSON() {
    var json = this.unfilterJSON();
    return JSON.parse(json);
  }

  function include(pattern) {
    return this.indexOf(pattern) > -1;
  }

  function startsWith(pattern) {
    return this.lastIndexOf(pattern, 0) === 0;
  }

  function endsWith(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.indexOf(pattern, d) === d;
  }

  function empty() {
    return this == '';
  }

  function blank() {
    return /^\s*$/.test(this);
  }

  function interpolate(object, pattern) {
    return new Template(this, pattern).evaluate(object);
  }

  return {
    gsub:           gsub,
    sub:            sub,
    scan:           scan,
    truncate:       truncate,
    strip:          String.prototype.trim || strip,
    stripTags:      stripTags,
    stripScripts:   stripScripts,
    extractScripts: extractScripts,
    evalScripts:    evalScripts,
    escapeHTML:     escapeHTML,
    unescapeHTML:   unescapeHTML,
    toQueryParams:  toQueryParams,
    parseQuery:     toQueryParams,
    toArray:        toArray,
    succ:           succ,
    times:          times,
    camelize:       camelize,
    capitalize:     capitalize,
    underscore:     underscore,
    dasherize:      dasherize,
    inspect:        inspect,
    unfilterJSON:   unfilterJSON,
    isJSON:         isJSON,
    evalJSON:       NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
    include:        include,
    startsWith:     startsWith,
    endsWith:       endsWith,
    empty:          empty,
    blank:          blank,
    interpolate:    interpolate
  };
})());

var Template = Class.create({
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    if (object && Object.isFunction(object.toTemplateReplacements))
      object = object.toTemplateReplacements();

    return this.template.gsub(this.pattern, function(match) {
      if (object == null) return (match[1] + '');

      var before = match[1] || '';
      if (before == '\\') return match[2];

      var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

      match = pattern.exec(expr);
      if (match == null) return before;

      while (match != null) {
        var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
        ctx = ctx[comp];
        if (null == ctx || '' == match[3]) break;
        expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
        match = pattern.exec(expr);
      }

      return before + String.interpret(ctx);
    });
  }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = { };

var Enumerable = (function() {
  function each(iterator, context) {
    var index = 0;
    try {
      this._each(function(value) {
        iterator.call(context, value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  }

  function eachSlice(number, iterator, context) {
    var index = -number, slices = [], array = this.toArray();
    if (number < 1) return array;
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.collect(iterator, context);
  }

  function all(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = true;
    this.each(function(value, index) {
      result = result && !!iterator.call(context, value, index);
      if (!result) throw $break;
    });
    return result;
  }

  function any(iterator, context) {
    iterator = iterator || Prototype.K;
    var result = false;
    this.each(function(value, index) {
      if (result = !!iterator.call(context, value, index))
        throw $break;
    });
    return result;
  }

  function collect(iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function detect(iterator, context) {
    var result;
    this.each(function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  }

  function findAll(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function grep(filter, iterator, context) {
    iterator = iterator || Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(RegExp.escape(filter));

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator.call(context, value, index));
    });
    return results;
  }

  function include(object) {
    if (Object.isFunction(this.indexOf))
      if (this.indexOf(object) != -1) return true;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  }

  function inGroupsOf(number, fillWith) {
    fillWith = Object.isUndefined(fillWith) ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  }

  function inject(memo, iterator, context) {
    this.each(function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }

  function invoke(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  }

  function max(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value >= result)
        result = value;
    });
    return result;
  }

  function min(iterator, context) {
    iterator = iterator || Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator.call(context, value, index);
      if (result == null || value < result)
        result = value;
    });
    return result;
  }

  function partition(iterator, context) {
    iterator = iterator || Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator.call(context, value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  }

  function pluck(property) {
    var results = [];
    this.each(function(value) {
      results.push(value[property]);
    });
    return results;
  }

  function reject(iterator, context) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator.call(context, value, index))
        results.push(value);
    });
    return results;
  }

  function sortBy(iterator, context) {
    return this.map(function(value, index) {
      return {
        value: value,
        criteria: iterator.call(context, value, index)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  }

  function toArray() {
    return this.map();
  }

  function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  }

  function size() {
    return this.toArray().length;
  }

  function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }









  return {
    each:       each,
    eachSlice:  eachSlice,
    all:        all,
    every:      all,
    any:        any,
    some:       any,
    collect:    collect,
    map:        collect,
    detect:     detect,
    findAll:    findAll,
    select:     findAll,
    filter:     findAll,
    grep:       grep,
    include:    include,
    member:     include,
    inGroupsOf: inGroupsOf,
    inject:     inject,
    invoke:     invoke,
    max:        max,
    min:        min,
    partition:  partition,
    pluck:      pluck,
    reject:     reject,
    sortBy:     sortBy,
    toArray:    toArray,
    entries:    toArray,
    zip:        zip,
    size:       size,
    inspect:    inspect,
    find:       detect
  };
})();

function $A(iterable) {
  if (!iterable) return [];
  if ('toArray' in Object(iterable)) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}


function $w(string) {
  if (!Object.isString(string)) return [];
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
  var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

  function each(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  }
  if (!_each) _each = each;

  function clear() {
    this.length = 0;
    return this;
  }

  function first() {
    return this[0];
  }

  function last() {
    return this[this.length - 1];
  }

  function compact() {
    return this.select(function(value) {
      return value != null;
    });
  }

  function flatten() {
    return this.inject([], function(array, value) {
      if (Object.isArray(value))
        return array.concat(value.flatten());
      array.push(value);
      return array;
    });
  }

  function without() {
    var values = slice.call(arguments, 0);
    return this.select(function(value) {
      return !values.include(value);
    });
  }

  function reverse(inline) {
    return (inline === false ? this.toArray() : this)._reverse();
  }

  function uniq(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  }

  function intersect(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  }


  function clone() {
    return slice.call(this, 0);
  }

  function size() {
    return this.length;
  }

  function inspect() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }

  function indexOf(item, i) {
    i || (i = 0);
    var length = this.length;
    if (i < 0) i = length + i;
    for (; i < length; i++)
      if (this[i] === item) return i;
    return -1;
  }

  function lastIndexOf(item, i) {
    i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
    var n = this.slice(0, i).reverse().indexOf(item);
    return (n < 0) ? n : i - n - 1;
  }

  function concat() {
    var array = slice.call(this, 0), item;
    for (var i = 0, length = arguments.length; i < length; i++) {
      item = arguments[i];
      if (Object.isArray(item) && !('callee' in item)) {
        for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
          array.push(item[j]);
      } else {
        array.push(item);
      }
    }
    return array;
  }

  Object.extend(arrayProto, Enumerable);

  if (!arrayProto._reverse)
    arrayProto._reverse = arrayProto.reverse;

  Object.extend(arrayProto, {
    _each:     _each,
    clear:     clear,
    first:     first,
    last:      last,
    compact:   compact,
    flatten:   flatten,
    without:   without,
    reverse:   reverse,
    uniq:      uniq,
    intersect: intersect,
    clone:     clone,
    toArray:   clone,
    size:      size,
    inspect:   inspect
  });

  var CONCAT_ARGUMENTS_BUGGY = (function() {
    return [].concat(arguments)[0][0] !== 1;
  })(1,2)

  if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

  if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
  if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
  return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
  function initialize(object) {
    this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
  }


  function _each(iterator) {
    for (var key in this._object) {
      var value = this._object[key], pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  }

  function set(key, value) {
    return this._object[key] = value;
  }

  function get(key) {
    if (this._object[key] !== Object.prototype[key])
      return this._object[key];
  }

  function unset(key) {
    var value = this._object[key];
    delete this._object[key];
    return value;
  }

  function toObject() {
    return Object.clone(this._object);
  }



  function keys() {
    return this.pluck('key');
  }

  function values() {
    return this.pluck('value');
  }

  function index(value) {
    var match = this.detect(function(pair) {
      return pair.value === value;
    });
    return match && match.key;
  }

  function merge(object) {
    return this.clone().update(object);
  }

  function update(object) {
    return new Hash(object).inject(this, function(result, pair) {
      result.set(pair.key, pair.value);
      return result;
    });
  }

  function toQueryPair(key, value) {
    if (Object.isUndefined(value)) return key;
    return key + '=' + encodeURIComponent(String.interpret(value));
  }

  function toQueryString() {
    return this.inject([], function(results, pair) {
      var key = encodeURIComponent(pair.key), values = pair.value;

      if (values && typeof values == 'object') {
        if (Object.isArray(values))
          return results.concat(values.map(toQueryPair.curry(key)));
      } else results.push(toQueryPair(key, values));
      return results;
    }).join('&');
  }

  function inspect() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }

  function clone() {
    return new Hash(this);
  }

  return {
    initialize:             initialize,
    _each:                  _each,
    set:                    set,
    get:                    get,
    unset:                  unset,
    toObject:               toObject,
    toTemplateReplacements: toObject,
    keys:                   keys,
    values:                 values,
    index:                  index,
    merge:                  merge,
    update:                 update,
    toQueryString:          toQueryString,
    inspect:                inspect,
    toJSON:                 toObject,
    clone:                  clone
  };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
  function toColorPart() {
    return this.toPaddedString(2, 16);
  }

  function succ() {
    return this + 1;
  }

  function times(iterator, context) {
    $R(0, this, true).each(iterator, context);
    return this;
  }

  function toPaddedString(length, radix) {
    var string = this.toString(radix || 10);
    return '0'.times(length - string.length) + string;
  }

  function abs() {
    return Math.abs(this);
  }

  function round() {
    return Math.round(this);
  }

  function ceil() {
    return Math.ceil(this);
  }

  function floor() {
    return Math.floor(this);
  }

  return {
    toColorPart:    toColorPart,
    succ:           succ,
    times:          times,
    toPaddedString: toPaddedString,
    abs:            abs,
    round:          round,
    ceil:           ceil,
    floor:          floor
  };
})());

function $R(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
  function initialize(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  }

  function _each(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  }

  function include(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }

  return {
    initialize: initialize,
    _each:      _each,
    include:    include
  };
})());



var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.isString(this.options.parameters) ?
          this.options.parameters :
          Object.toQueryString(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params += (params ? '&' : '') + "_method=" + this.method;
      this.method = 'post';
    }

    if (params) {
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    this.parameters = params.toQueryParams();

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if (readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});


function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}

/*--------------------------------------------------------------------------*/

if (!Node) var Node = { };

if (!Node.ELEMENT_NODE) {
  Object.extend(Node, {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  });
}



(function(global) {

  var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function(){
    try {
      var el = document.createElement('<input name="x">');
      return el.tagName.toLowerCase() === 'input' && el.name === 'x';
    }
    catch(err) {
      return false;
    }
  })();

  var element = global.Element;

  global.Element = function(tagName, attributes) {
    attributes = attributes || { };
    tagName = tagName.toLowerCase();
    var cache = Element.cache;
    if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
      tagName = '<' + tagName + ' name="' + attributes.name + '">';
      delete attributes.name;
      return Element.writeAttribute(document.createElement(tagName), attributes);
    }
    if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
    return Element.writeAttribute(cache[tagName].cloneNode(false), attributes);
  };

  Object.extend(global.Element, element || { });
  if (element) global.Element.prototype = element.prototype;

})(this);

Element.idCounter = 1;
Element.cache = { };

function purgeElement(element) {
  var uid = element._prototypeUID;
  if (uid) {
    Element.stopObserving(element);
    element._prototypeUID = void 0;
    delete Element.Storage[uid];
  }
}

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    element = $(element);
    element.style.display = 'none';
    return element;
  },

  show: function(element) {
    element = $(element);
    element.style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: (function(){

    var SELECT_ELEMENT_INNERHTML_BUGGY = (function(){
      var el = document.createElement("select"),
          isBuggy = true;
      el.innerHTML = "<option value=\"test\">test</option>";
      if (el.options && el.options[0]) {
        isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
      }
      el = null;
      return isBuggy;
    })();

    var TABLE_ELEMENT_INNERHTML_BUGGY = (function(){
      try {
        var el = document.createElement("table");
        if (el && el.tBodies) {
          el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
          var isBuggy = typeof el.tBodies[0] == "undefined";
          el = null;
          return isBuggy;
        }
      } catch (e) {
        return true;
      }
    })();

    var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
      var s = document.createElement("script"),
          isBuggy = false;
      try {
        s.appendChild(document.createTextNode(""));
        isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
      } catch (e) {
        isBuggy = true;
      }
      s = null;
      return isBuggy;
    })();

    function update(element, content) {
      element = $(element);

      var descendants = element.getElementsByTagName('*'),
       i = descendants.length;
      while (i--) purgeElement(descendants[i]);

      if (content && content.toElement)
        content = content.toElement();

      if (Object.isElement(content))
        return element.update().insert(content);

      content = Object.toHTML(content);

      var tagName = element.tagName.toUpperCase();

      if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
        element.text = content;
        return element;
      }

      if (SELECT_ELEMENT_INNERHTML_BUGGY || TABLE_ELEMENT_INNERHTML_BUGGY) {
        if (tagName in Element._insertionTranslations.tags) {
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
          Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
              element.appendChild(node)
            });
        }
        else {
          element.innerHTML = content.stripScripts();
        }
      }
      else {
        element.innerHTML = content.stripScripts();
      }

      content.evalScripts.bind(content).defer();
      return element;
    }

    return update;
  })(),

  replace: function(element, content) {
    element = $(element);
    if (content && content.toElement) content = content.toElement();
    else if (!Object.isElement(content)) {
      content = Object.toHTML(content);
      var range = element.ownerDocument.createRange();
      range.selectNode(element);
      content.evalScripts.bind(content).defer();
      content = range.createContextualFragment(content.stripScripts());
    }
    element.parentNode.replaceChild(content, element);
    return element;
  },

  insert: function(element, insertions) {
    element = $(element);

    if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
          insertions = {bottom:insertions};

    var content, insert, tagName, childNodes;

    for (var position in insertions) {
      content  = insertions[position];
      position = position.toLowerCase();
      insert = Element._insertionTranslations[position];

      if (content && content.toElement) content = content.toElement();
      if (Object.isElement(content)) {
        insert(element, content);
        continue;
      }

      content = Object.toHTML(content);

      tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

      childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

      if (position == 'top' || position == 'after') childNodes.reverse();
      childNodes.each(insert.curry(element));

      content.evalScripts.bind(content).defer();
    }

    return element;
  },

  wrap: function(element, wrapper, attributes) {
    element = $(element);
    if (Object.isElement(wrapper))
      $(wrapper).writeAttribute(attributes || { });
    else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
    else wrapper = new Element('div', wrapper);
    if (element.parentNode)
      element.parentNode.replaceChild(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property, maximumLength) {
    element = $(element);
    maximumLength = maximumLength || -1;
    var elements = [];

    while (element = element[property]) {
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
      if (elements.length == maximumLength)
        break;
    }

    return elements;
  },

  ancestors: function(element) {
    return Element.recursivelyCollect(element, 'parentNode');
  },

  descendants: function(element) {
    return Element.select(element, "*");
  },

  firstDescendant: function(element) {
    element = $(element).firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return $(element);
  },

  immediateDescendants: function(element) {
    var results = [], child = $(element).firstChild;
    while (child) {
      if (child.nodeType === 1) {
        results.push(Element.extend(child));
      }
      child = child.nextSibling;
    }
    return results;
  },

  previousSiblings: function(element, maximumLength) {
    return Element.recursivelyCollect(element, 'previousSibling');
  },

  nextSiblings: function(element) {
    return Element.recursivelyCollect(element, 'nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
  },

  match: function(element, selector) {
    element = $(element);
    if (Object.isString(selector))
      return Prototype.Selector.match(element, selector);
    return selector.match(element);
  },

  up: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return $(element.parentNode);
    var ancestors = Element.ancestors(element);
    return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
  },

  down: function(element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return Element.firstDescendant(element);
    return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
  },

  previous: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.previousSiblings(), expression, index);
    } else {
      return element.recursivelyCollect("previousSibling", index + 1)[index];
    }
  },

  next: function(element, expression, index) {
    element = $(element);
    if (Object.isNumber(expression)) index = expression, expression = false;
    if (!Object.isNumber(index)) index = 0;

    if (expression) {
      return Prototype.Selector.find(element.nextSiblings(), expression, index);
    } else {
      var maximumLength = Object.isNumber(index) ? index + 1 : 1;
      return element.recursivelyCollect("nextSibling", index + 1)[index];
    }
  },


  select: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element);
  },

  adjacent: function(element) {
    element = $(element);
    var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
    return Prototype.Selector.select(expressions, element.parentNode).without(element);
  },

  identify: function(element) {
    element = $(element);
    var id = Element.readAttribute(element, 'id');
    if (id) return id;
    do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
    Element.writeAttribute(element, 'id', id);
    return id;
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (Prototype.Browser.IE) {
      var t = Element._attributeTranslations.read;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name]) name = t.names[name];
      if (name.include(':')) {
        return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
      }
    }
    return element.getAttribute(name);
  },

  writeAttribute: function(element, name, value) {
    element = $(element);
    var attributes = { }, t = Element._attributeTranslations.write;

    if (typeof name == 'object') attributes = name;
    else attributes[name] = Object.isUndefined(value) ? true : value;

    for (var attr in attributes) {
      name = t.names[attr] || attr;
      value = attributes[attr];
      if (t.values[attr]) name = t.values[attr](element, value);
      if (value === false || value === null)
        element.removeAttribute(name);
      else if (value === true)
        element.setAttribute(name, name);
      else element.setAttribute(name, value);
    }
    return element;
  },

  getHeight: function(element) {
    return Element.getDimensions(element).height;
  },

  getWidth: function(element) {
    return Element.getDimensions(element).width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    if (!Element.hasClassName(element, className))
      element.className += (element.className ? ' ' : '') + className;
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
  },

  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.blank();
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);

    if (element.compareDocumentPosition)
      return (element.compareDocumentPosition(ancestor) & 8) === 8;

    if (ancestor.contains)
      return ancestor.contains(element) && ancestor !== element;

    while (element = element.parentNode)
      if (element == ancestor) return true;

    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    style = style == 'float' ? 'cssFloat' : style.camelize();
    var value = element.style[style];
    if (!value || value == 'auto') {
      var css = document.defaultView.getComputedStyle(element, null);
      value = css ? css[style] : null;
    }
    if (style == 'opacity') return value ? parseFloat(value) : 1.0;
    return value == 'auto' ? null : value;
  },

  getOpacity: function(element) {
    return $(element).getStyle('opacity');
  },

  setStyle: function(element, styles) {
    element = $(element);
    var elementStyle = element.style, match;
    if (Object.isString(styles)) {
      element.style.cssText += ';' + styles;
      return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles)
      if (property == 'opacity') element.setOpacity(styles[property]);
      else
        elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

    return element;
  },

  setOpacity: function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
    return element;
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      if (Prototype.Browser.Opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = Element.getStyle(element, 'overflow') || 'auto';
    if (element._overflow !== 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    if (element.parentNode) {
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        element = element.offsetParent;
      } while (element);
    }
    return Element._returnOffset(valueL, valueT);
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (element.tagName.toUpperCase() == 'BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  absolutize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'absolute') return element;

    var offsets = Element.positionedOffset(element),
        top     = offsets[1],
        left    = offsets[0],
        width   = element.clientWidth,
        height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
    return element;
  },

  relativize: function(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') == 'relative') return element;

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0),
        left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
    return element;
  },

  cumulativeScrollOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return Element._returnOffset(valueL, valueT);
  },

  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return $(element);

    return $(document.body);
  },

  viewportOffset: function(forElement) {
    var valueT = 0,
        valueL = 0,
        element = forElement;

    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      if (element.offsetParent == document.body &&
        Element.getStyle(element, 'position') == 'absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!Prototype.Browser.Opera || (element.tagName && (element.tagName.toUpperCase() == 'BODY'))) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return Element._returnOffset(valueL, valueT);
  },

  clonePosition: function(element, source) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || { });

    source = $(source);
    var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

    element = $(element);

    if (Element.getStyle(element, 'position') == 'absolute') {
      parent = Element.getOffsetParent(element);
      delta = Element.viewportOffset(parent);
    }

    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    if (options.setLeft)   element.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if (options.setTop)    element.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if (options.setWidth)  element.style.width = source.offsetWidth + 'px';
    if (options.setHeight) element.style.height = source.offsetHeight + 'px';
    return element;
  }
};

Object.extend(Element.Methods, {
  getElementsBySelector: Element.Methods.select,

  childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
  write: {
    names: {
      className: 'class',
      htmlFor:   'for'
    },
    values: { }
  }
};

if (Prototype.Browser.Opera) {
  Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
      switch (style) {
        case 'left': case 'top': case 'right': case 'bottom':
          if (proceed(element, 'position') === 'static') return null;
        case 'height': case 'width':
          if (!Element.visible(element)) return null;

          var dim = parseInt(proceed(element, style), 10);

          if (dim !== element['offset' + style.capitalize()])
            return dim + 'px';

          var properties;
          if (style === 'height') {
            properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
          }
          else {
            properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
          }
          return properties.inject(dim, function(memo, property) {
            var val = proceed(element, property);
            return val === null ? memo : memo - parseInt(val, 10);
          }) + 'px';
        default: return proceed(element, style);
      }
    }
  );

  Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
      if (attribute === 'title') return element.title;
      return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
  Element.Methods.getOffsetParent = Element.Methods.getOffsetParent.wrap(
    function(proceed, element) {
      element = $(element);
      if (!element.parentNode) return $(document.body);
      var position = element.getStyle('position');
      if (position !== 'static') return proceed(element);
      element.setStyle({ position: 'relative' });
      var value = proceed(element);
      element.setStyle({ position: position });
      return value;
    }
  );

  $w('positionedOffset viewportOffset').each(function(method) {
    Element.Methods[method] = Element.Methods[method].wrap(
      function(proceed, element) {
        element = $(element);
        if (!element.parentNode) return Element._returnOffset(0, 0);
        var position = element.getStyle('position');
        if (position !== 'static') return proceed(element);
        var offsetParent = element.getOffsetParent();
        if (offsetParent && offsetParent.getStyle('position') === 'fixed')
          offsetParent.setStyle({ zoom: 1 });
        element.setStyle({ position: 'relative' });
        var value = proceed(element);
        element.setStyle({ position: position });
        return value;
      }
    );
  });

  Element.Methods.getStyle = function(element, style) {
    element = $(element);
    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
    var value = element.style[style];
    if (!value && element.currentStyle) value = element.currentStyle[style];

    if (style == 'opacity') {
      if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if (value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }

    if (value == 'auto') {
      if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
        return element['offset' + style.capitalize()] + 'px';
      return null;
    }
    return value;
  };

  Element.Methods.setOpacity = function(element, value) {
    function stripAlpha(filter){
      return filter.replace(/alpha\([^\)]*\)/gi,'');
    }
    element = $(element);
    var currentStyle = element.currentStyle;
    if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
        element.style.zoom = 1;

    var filter = element.getStyle('filter'), style = element.style;
    if (value == 1 || value === '') {
      (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
      return element;
    } else if (value < 0.00001) value = 0;
    style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
    return element;
  };

  Element._attributeTranslations = (function(){

    var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

    el.setAttribute(classProp, 'x');

    if (el.className !== 'x') {
      el.setAttribute('class', 'x');
      if (el.className === 'x') {
        classProp = 'class';
      }
    }
    el = null;

    el = document.createElement('label');
    el.setAttribute(forProp, 'x');
    if (el.htmlFor !== 'x') {
      el.setAttribute('htmlFor', 'x');
      if (el.htmlFor === 'x') {
        forProp = 'htmlFor';
      }
    }
    el = null;

    return {
      read: {
        names: {
          'class':      classProp,
          'className':  classProp,
          'for':        forProp,
          'htmlFor':    forProp
        },
        values: {
          _getAttr: function(element, attribute) {
            return element.getAttribute(attribute);
          },
          _getAttr2: function(element, attribute) {
            return element.getAttribute(attribute, 2);
          },
          _getAttrNode: function(element, attribute) {
            var node = element.getAttributeNode(attribute);
            return node ? node.value : "";
          },
          _getEv: (function(){

            var el = document.createElement('div'), f;
            el.onclick = Prototype.emptyFunction;
            var value = el.getAttribute('onclick');

            if (String(value).indexOf('{') > -1) {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                attribute = attribute.toString();
                attribute = attribute.split('{')[1];
                attribute = attribute.split('}')[0];
                return attribute.strip();
              };
            }
            else if (value === '') {
              f = function(element, attribute) {
                attribute = element.getAttribute(attribute);
                if (!attribute) return null;
                return attribute.strip();
              };
            }
            el = null;
            return f;
          })(),
          _flag: function(element, attribute) {
            return $(element).hasAttribute(attribute) ? attribute : null;
          },
          style: function(element) {
            return element.style.cssText.toLowerCase();
          },
          title: function(element) {
            return element.title;
          }
        }
      }
    }
  })();

  Element._attributeTranslations.write = {
    names: Object.extend({
      cellpadding: 'cellPadding',
      cellspacing: 'cellSpacing'
    }, Element._attributeTranslations.read.names),
    values: {
      checked: function(element, value) {
        element.checked = !!value;
      },

      style: function(element, value) {
        element.style.cssText = value ? value : '';
      }
    }
  };

  Element._attributeTranslations.has = {};

  $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
    Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
    Element._attributeTranslations.has[attr.toLowerCase()] = attr;
  });

  (function(v) {
    Object.extend(v, {
      href:        v._getAttr2,
      src:         v._getAttr2,
      type:        v._getAttr,
      action:      v._getAttrNode,
      disabled:    v._flag,
      checked:     v._flag,
      readonly:    v._flag,
      multiple:    v._flag,
      onload:      v._getEv,
      onunload:    v._getEv,
      onclick:     v._getEv,
      ondblclick:  v._getEv,
      onmousedown: v._getEv,
      onmouseup:   v._getEv,
      onmouseover: v._getEv,
      onmousemove: v._getEv,
      onmouseout:  v._getEv,
      onfocus:     v._getEv,
      onblur:      v._getEv,
      onkeypress:  v._getEv,
      onkeydown:   v._getEv,
      onkeyup:     v._getEv,
      onsubmit:    v._getEv,
      onreset:     v._getEv,
      onselect:    v._getEv,
      onchange:    v._getEv
    });
  })(Element._attributeTranslations.read.values);

  if (Prototype.BrowserFeatures.ElementExtensions) {
    (function() {
      function _descendants(element) {
        var nodes = element.getElementsByTagName('*'), results = [];
        for (var i = 0, node; node = nodes[i]; i++)
          if (node.tagName !== "!") // Filter out comment nodes.
            results.push(node);
        return results;
      }

      Element.Methods.down = function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return element.firstDescendant();
        return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
      }
    })();
  }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
    return element;
  };
}

else if (Prototype.Browser.WebKit) {
  Element.Methods.setOpacity = function(element, value) {
    element = $(element);
    element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

    if (value == 1)
      if (element.tagName.toUpperCase() == 'IMG' && element.width) {
        element.width++; element.width--;
      } else try {
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
      } catch (e) { }

    return element;
  };

  Element.Methods.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return Element._returnOffset(valueL, valueT);
  };
}

if ('outerHTML' in document.documentElement) {
  Element.Methods.replace = function(element, content) {
    element = $(element);

    if (content && content.toElement) content = content.toElement();
    if (Object.isElement(content)) {
      element.parentNode.replaceChild(content, element);
      return element;
    }

    content = Object.toHTML(content);
    var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

    if (Element._insertionTranslations.tags[tagName]) {
      var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
      parent.removeChild(element);
      if (nextSibling)
        fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
      else
        fragments.each(function(node) { parent.appendChild(node) });
    }
    else element.outerHTML = content.stripScripts();

    content.evalScripts.bind(content).defer();
    return element;
  };
}

Element._returnOffset = function(l, t) {
  var result = [l, t];
  result.left = l;
  result.top = t;
  return result;
};

Element._getContentFromAnonymousElement = function(tagName, html) {
  var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];
  if (t) {
    div.innerHTML = t[0] + html + t[1];
    for (var i = t[2]; i--; ) {
      div = div.firstChild;
    }
  }
  else {
    div.innerHTML = html;
  }
  return $A(div.childNodes);
};

Element._insertionTranslations = {
  before: function(element, node) {
    element.parentNode.insertBefore(node, element);
  },
  top: function(element, node) {
    element.insertBefore(node, element.firstChild);
  },
  bottom: function(element, node) {
    element.appendChild(node);
  },
  after: function(element, node) {
    element.parentNode.insertBefore(node, element.nextSibling);
  },
  tags: {
    TABLE:  ['<table>',                '</table>',                   1],
    TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
    TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
    TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
    SELECT: ['<select>',               '</select>',                  1]
  }
};

(function() {
  var tags = Element._insertionTranslations.tags;
  Object.extend(tags, {
    THEAD: tags.TBODY,
    TFOOT: tags.TBODY,
    TH:    tags.TD
  });
})();

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    attribute = Element._attributeTranslations.has[attribute] || attribute;
    var node = $(element).getAttributeNode(attribute);
    return !!(node && node.specified);
  }
};

Element.Methods.ByTag = { };

Object.extend(Element, Element.Methods);

(function(div) {

  if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
    window.HTMLElement = { };
    window.HTMLElement.prototype = div['__proto__'];
    Prototype.BrowserFeatures.ElementExtensions = true;
  }

  div = null;

})(document.createElement('div'));

Element.extend = (function() {

  function checkDeficiency(tagName) {
    if (typeof window.Element != 'undefined') {
      var proto = window.Element.prototype;
      if (proto) {
        var id = '_' + (Math.random()+'').slice(2),
            el = document.createElement(tagName);
        proto[id] = 'x';
        var isBuggy = (el[id] !== 'x');
        delete proto[id];
        el = null;
        return isBuggy;
      }
    }
    return false;
  }

  function extendElementWith(element, methods) {
    for (var property in methods) {
      var value = methods[property];
      if (Object.isFunction(value) && !(property in element))
        element[property] = value.methodize();
    }
  }

  var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

  if (Prototype.BrowserFeatures.SpecificElementExtensions) {
    if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
      return function(element) {
        if (element && typeof element._extendedByPrototype == 'undefined') {
          var t = element.tagName;
          if (t && (/^(?:object|applet|embed)$/i.test(t))) {
            extendElementWith(element, Element.Methods);
            extendElementWith(element, Element.Methods.Simulated);
            extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
          }
        }
        return element;
      }
    }
    return Prototype.K;
  }

  var Methods = { }, ByTag = Element.Methods.ByTag;

  var extend = Object.extend(function(element) {
    if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

    var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

    if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

    extendElementWith(element, methods);

    element._extendedByPrototype = Prototype.emptyFunction;
    return element;

  }, {
    refresh: function() {
      if (!Prototype.BrowserFeatures.ElementExtensions) {
        Object.extend(Methods, Element.Methods);
        Object.extend(Methods, Element.Methods.Simulated);
      }
    }
  });

  extend.refresh();
  return extend;
})();

if (document.documentElement.hasAttribute) {
  Element.hasAttribute = function(element, attribute) {
    return element.hasAttribute(attribute);
  };
}
else {
  Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
  var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

  if (!methods) {
    Object.extend(Form, Form.Methods);
    Object.extend(Form.Element, Form.Element.Methods);
    Object.extend(Element.Methods.ByTag, {
      "FORM":     Object.clone(Form.Methods),
      "INPUT":    Object.clone(Form.Element.Methods),
      "SELECT":   Object.clone(Form.Element.Methods),
      "TEXTAREA": Object.clone(Form.Element.Methods)
    });
  }

  if (arguments.length == 2) {
    var tagName = methods;
    methods = arguments[1];
  }

  if (!tagName) Object.extend(Element.Methods, methods || { });
  else {
    if (Object.isArray(tagName)) tagName.each(extend);
    else extend(tagName);
  }

  function extend(tagName) {
    tagName = tagName.toUpperCase();
    if (!Element.Methods.ByTag[tagName])
      Element.Methods.ByTag[tagName] = { };
    Object.extend(Element.Methods.ByTag[tagName], methods);
  }

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    for (var property in methods) {
      var value = methods[property];
      if (!Object.isFunction(value)) continue;
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = value.methodize();
    }
  }

  function findDOMClass(tagName) {
    var klass;
    var trans = {
      "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
      "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
      "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
      "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
      "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];

    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

    element = null;
    return proto;
  }

  var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

  if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
  }

  if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
      var klass = findDOMClass(tag);
      if (Object.isUndefined(klass)) continue;
      copy(T[tag], klass.prototype);
    }
  }

  Object.extend(Element, Element.Methods);
  delete Element.ByTag;

  if (Element.extend.refresh) Element.extend.refresh();
  Element.cache = { };
};


document.viewport = {

  getDimensions: function() {
    return { width: this.getWidth(), height: this.getHeight() };
  },

  getScrollOffsets: function() {
    return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop);
  }
};

(function(viewport) {
  var B = Prototype.Browser, doc = document, element, property = {};

  function getRootElement() {
    if (B.WebKit && !doc.evaluate)
      return document;

    if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
      return document.body;

    return document.documentElement;
  }

  function define(D) {
    if (!element) element = getRootElement();

    property[D] = 'client' + D;

    viewport['get' + D] = function() { return element[property[D]] };
    return viewport['get' + D]();
  }

  viewport.getWidth  = define.curry('Width');

  viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
  UID: 1
};

Element.addMethods({
  getStorage: function(element) {
    if (!(element = $(element))) return;

    var uid;
    if (element === window) {
      uid = 0;
    } else {
      if (typeof element._prototypeUID === "undefined")
        element._prototypeUID = Element.Storage.UID++;
      uid = element._prototypeUID;
    }

    if (!Element.Storage[uid])
      Element.Storage[uid] = $H();

    return Element.Storage[uid];
  },

  store: function(element, key, value) {
    if (!(element = $(element))) return;

    if (arguments.length === 2) {
      Element.getStorage(element).update(key);
    } else {
      Element.getStorage(element).set(key, value);
    }

    return element;
  },

  retrieve: function(element, key, defaultValue) {
    if (!(element = $(element))) return;
    var hash = Element.getStorage(element), value = hash.get(key);

    if (Object.isUndefined(value)) {
      hash.set(key, defaultValue);
      value = defaultValue;
    }

    return value;
  },

  clone: function(element, deep) {
    if (!(element = $(element))) return;
    var clone = element.cloneNode(deep);
    clone._prototypeUID = void 0;
    if (deep) {
      var descendants = Element.select(clone, '*'),
          i = descendants.length;
      while (i--) {
        descendants[i]._prototypeUID = void 0;
      }
    }
    return Element.extend(clone);
  },

  purge: function(element) {
    if (!(element = $(element))) return;
    purgeElement(element);

    var descendants = element.getElementsByTagName('*'),
     i = descendants.length;

    while (i--) purgeElement(descendants[i]);

    return null;
  }
});

(function() {

  function toDecimal(pctString) {
    var match = pctString.match(/^(\d+)%?$/i);
    if (!match) return null;
    return (Number(match[1]) / 100);
  }

  function getPixelValue(value, property, context) {
    var element = null;
    if (Object.isElement(value)) {
      element = value;
      value = element.getStyle(property);
    }

    if (value === null) {
      return null;
    }

    if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
      return window.parseFloat(value);
    }

    var isPercentage = value.include('%'), isViewport = (context === document.viewport);

    if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
      var style = element.style.left, rStyle = element.runtimeStyle.left;
      element.runtimeStyle.left = element.currentStyle.left;
      element.style.left = value || 0;
      value = element.style.pixelLeft;
      element.style.left = style;
      element.runtimeStyle.left = rStyle;

      return value;
    }

    if (element && isPercentage) {
      context = context || element.parentNode;
      var decimal = toDecimal(value);
      var whole = null;
      var position = element.getStyle('position');

      var isHorizontal = property.include('left') || property.include('right') ||
       property.include('width');

      var isVertical =  property.include('top') || property.include('bottom') ||
        property.include('height');

      if (context === document.viewport) {
        if (isHorizontal) {
          whole = document.viewport.getWidth();
        } else if (isVertical) {
          whole = document.viewport.getHeight();
        }
      } else {
        if (isHorizontal) {
          whole = $(context).measure('width');
        } else if (isVertical) {
          whole = $(context).measure('height');
        }
      }

      return (whole === null) ? 0 : whole * decimal;
    }

    return 0;
  }

  function toCSSPixels(number) {
    if (Object.isString(number) && number.endsWith('px')) {
      return number;
    }
    return number + 'px';
  }

  function isDisplayed(element) {
    var originalElement = element;
    while (element && element.parentNode) {
      var display = element.getStyle('display');
      if (display === 'none') {
        return false;
      }
      element = $(element.parentNode);
    }
    return true;
  }

  var hasLayout = Prototype.K;
  if ('currentStyle' in document.documentElement) {
    hasLayout = function(element) {
      if (!element.currentStyle.hasLayout) {
        element.style.zoom = 1;
      }
      return element;
    };
  }

  function cssNameFor(key) {
    if (key.include('border')) key = key + '-width';
    return key.camelize();
  }

  Element.Layout = Class.create(Hash, {
    initialize: function($super, element, preCompute) {
      $super();
      this.element = $(element);

      Element.Layout.PROPERTIES.each( function(property) {
        this._set(property, null);
      }, this);

      if (preCompute) {
        this._preComputing = true;
        this._begin();
        Element.Layout.PROPERTIES.each( this._compute, this );
        this._end();
        this._preComputing = false;
      }
    },

    _set: function(property, value) {
      return Hash.prototype.set.call(this, property, value);
    },

    set: function(property, value) {
      throw "Properties of Element.Layout are read-only.";
    },

    get: function($super, property) {
      var value = $super(property);
      return value === null ? this._compute(property) : value;
    },

    _begin: function() {
      if (this._prepared) return;

      var element = this.element;
      if (isDisplayed(element)) {
        this._prepared = true;
        return;
      }

      var originalStyles = {
        position:   element.style.position   || '',
        width:      element.style.width      || '',
        visibility: element.style.visibility || '',
        display:    element.style.display    || ''
      };

      element.store('prototype_original_styles', originalStyles);

      var position = element.getStyle('position'),
       width = element.getStyle('width');

      var context = (position === 'fixed') ? document.viewport :
       element.parentNode;

      element.setStyle({
        position:   'absolute',
        visibility: 'hidden',
        display:    'block'
      });

      var positionedWidth = element.getStyle('width');

      var newWidth;
      if (width && (positionedWidth === width)) {
        newWidth = getPixelValue(element, 'width', context);
      } else if (width && (position === 'absolute' || position === 'fixed')) {
        newWidth = getPixelValue(element, 'width', context);
      } else {
        var parent = element.parentNode, pLayout = $(parent).getLayout();

        newWidth = pLayout.get('width') -
         this.get('margin-left') -
         this.get('border-left') -
         this.get('padding-left') -
         this.get('padding-right') -
         this.get('border-right') -
         this.get('margin-right');
      }

      element.setStyle({ width: newWidth + 'px' });

      this._prepared = true;
    },

    _end: function() {
      var element = this.element;
      var originalStyles = element.retrieve('prototype_original_styles');
      element.store('prototype_original_styles', null);
      element.setStyle(originalStyles);
      this._prepared = false;
    },

    _compute: function(property) {
      var COMPUTATIONS = Element.Layout.COMPUTATIONS;
      if (!(property in COMPUTATIONS)) {
        throw "Property not found.";
      }

      return this._set(property, COMPUTATIONS[property].call(this, this.element));
    },

    toObject: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var obj = {};
      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        var value = this.get(key);
        if (value != null) obj[key] = value;
      }, this);
      return obj;
    },

    toHash: function() {
      var obj = this.toObject.apply(this, arguments);
      return new Hash(obj);
    },

    toCSS: function() {
      var args = $A(arguments);
      var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
      var css = {};

      keys.each( function(key) {
        if (!Element.Layout.PROPERTIES.include(key)) return;
        if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;

        var value = this.get(key);
        if (value != null) css[cssNameFor(key)] = value + 'px';
      }, this);
      return css;
    },

    inspect: function() {
      return "#<Element.Layout>";
    }
  });

  Object.extend(Element.Layout, {
    PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height'),

    COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),

    COMPUTATIONS: {
      'height': function(element) {
        if (!this._preComputing) this._begin();

        var bHeight = this.get('border-box-height');
        if (bHeight <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bTop = this.get('border-top'),
         bBottom = this.get('border-bottom');

        var pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        if (!this._preComputing) this._end();

        return bHeight - bTop - bBottom - pTop - pBottom;
      },

      'width': function(element) {
        if (!this._preComputing) this._begin();

        var bWidth = this.get('border-box-width');
        if (bWidth <= 0) {
          if (!this._preComputing) this._end();
          return 0;
        }

        var bLeft = this.get('border-left'),
         bRight = this.get('border-right');

        var pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        if (!this._preComputing) this._end();

        return bWidth - bLeft - bRight - pLeft - pRight;
      },

      'padding-box-height': function(element) {
        var height = this.get('height'),
         pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

        return height + pTop + pBottom;
      },

      'padding-box-width': function(element) {
        var width = this.get('width'),
         pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

        return width + pLeft + pRight;
      },

      'border-box-height': function(element) {
        if (!this._preComputing) this._begin();
        var height = element.offsetHeight;
        if (!this._preComputing) this._end();
        return height;
      },

      'border-box-width': function(element) {
        if (!this._preComputing) this._begin();
        var width = element.offsetWidth;
        if (!this._preComputing) this._end();
        return width;
      },

      'margin-box-height': function(element) {
        var bHeight = this.get('border-box-height'),
         mTop = this.get('margin-top'),
         mBottom = this.get('margin-bottom');

        if (bHeight <= 0) return 0;

        return bHeight + mTop + mBottom;
      },

      'margin-box-width': function(element) {
        var bWidth = this.get('border-box-width'),
         mLeft = this.get('margin-left'),
         mRight = this.get('margin-right');

        if (bWidth <= 0) return 0;

        return bWidth + mLeft + mRight;
      },

      'top': function(element) {
        var offset = element.positionedOffset();
        return offset.top;
      },

      'bottom': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pHeight = parent.measure('height');

        var mHeight = this.get('border-box-height');

        return pHeight - mHeight - offset.top;
      },

      'left': function(element) {
        var offset = element.positionedOffset();
        return offset.left;
      },

      'right': function(element) {
        var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pWidth = parent.measure('width');

        var mWidth = this.get('border-box-width');

        return pWidth - mWidth - offset.left;
      },

      'padding-top': function(element) {
        return getPixelValue(element, 'paddingTop');
      },

      'padding-bottom': function(element) {
        return getPixelValue(element, 'paddingBottom');
      },

      'padding-left': function(element) {
        return getPixelValue(element, 'paddingLeft');
      },

      'padding-right': function(element) {
        return getPixelValue(element, 'paddingRight');
      },

      'border-top': function(element) {
        return getPixelValue(element, 'borderTopWidth');
      },

      'border-bottom': function(element) {
        return getPixelValue(element, 'borderBottomWidth');
      },

      'border-left': function(element) {
        return getPixelValue(element, 'borderLeftWidth');
      },

      'border-right': function(element) {
        return getPixelValue(element, 'borderRightWidth');
      },

      'margin-top': function(element) {
        return getPixelValue(element, 'marginTop');
      },

      'margin-bottom': function(element) {
        return getPixelValue(element, 'marginBottom');
      },

      'margin-left': function(element) {
        return getPixelValue(element, 'marginLeft');
      },

      'margin-right': function(element) {
        return getPixelValue(element, 'marginRight');
      }
    }
  });

  if ('getBoundingClientRect' in document.documentElement) {
    Object.extend(Element.Layout.COMPUTATIONS, {
      'right': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.right - rect.right).round();
      },

      'bottom': function(element) {
        var parent = hasLayout(element.getOffsetParent());
        var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

        return (pRect.bottom - rect.bottom).round();
      }
    });
  }

  Element.Offset = Class.create({
    initialize: function(left, top) {
      this.left = left.round();
      this.top  = top.round();

      this[0] = this.left;
      this[1] = this.top;
    },

    relativeTo: function(offset) {
      return new Element.Offset(
        this.left - offset.left,
        this.top  - offset.top
      );
    },

    inspect: function() {
      return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
    },

    toString: function() {
      return "[#{left}, #{top}]".interpolate(this);
    },

    toArray: function() {
      return [this.left, this.top];
    }
  });

  function getLayout(element, preCompute) {
    return new Element.Layout(element, preCompute);
  }

  function measure(element, property) {
    return $(element).getLayout().get(property);
  }

  function getDimensions(element) {
    var layout = $(element).getLayout();
    return {
      width:  layout.get('width'),
      height: layout.get('height')
    };
  }

  function getOffsetParent(element) {
    if (isDetached(element)) return $(document.body);

    var isInline = (Element.getStyle(element, 'display') === 'inline');
    if (!isInline && element.offsetParent) return $(element.offsetParent);
    if (element === document.body) return $(element);

    while ((element = element.parentNode) && element !== document.body) {
      if (Element.getStyle(element, 'position') !== 'static') {
        return (element.nodeName === 'HTML') ? $(document.body) : $(element);
      }
    }

    return $(document.body);
  }


  function cumulativeOffset(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return new Element.Offset(valueL, valueT);
  }

  function positionedOffset(element) {
    var layout = element.getLayout();

    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if (isBody(element)) break;
        var p = Element.getStyle(element, 'position');
        if (p !== 'static') break;
      }
    } while (element);

    valueL -= layout.get('margin-top');
    valueT -= layout.get('margin-left');

    return new Element.Offset(valueL, valueT);
  }

  function cumulativeScrollOffset(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return new Element.Offset(valueL, valueT);
  }

  function viewportOffset(forElement) {
    var valueT = 0, valueL = 0, docBody = document.body;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == docBody &&
        Element.getStyle(element, 'position') == 'absolute') break;
    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (element != docBody) {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);
    return new Element.Offset(valueL, valueT);
  }

  function absolutize(element) {
    element = $(element);

    if (Element.getStyle(element, 'position') === 'absolute') {
      return element;
    }

    var offsetParent = getOffsetParent(element);
    var eOffset = element.viewportOffset(),
     pOffset = offsetParent.viewportOffset();

    var offset = eOffset.relativeTo(pOffset);
    var layout = element.getLayout();

    element.store('prototype_absolutize_original_styles', {
      left:   element.getStyle('left'),
      top:    element.getStyle('top'),
      width:  element.getStyle('width'),
      height: element.getStyle('height')
    });

    element.setStyle({
      position: 'absolute',
      top:    offset.top + 'px',
      left:   offset.left + 'px',
      width:  layout.get('width') + 'px',
      height: layout.get('height') + 'px'
    });

    return element;
  }

  function relativize(element) {
    element = $(element);
    if (Element.getStyle(element, 'position') === 'relative') {
      return element;
    }

    var originalStyles =
     element.retrieve('prototype_absolutize_original_styles');

    if (originalStyles) element.setStyle(originalStyles);
    return element;
  }

  Element.addMethods({
    getLayout:              getLayout,
    measure:                measure,
    getDimensions:          getDimensions,
    getOffsetParent:        getOffsetParent,
    cumulativeOffset:       cumulativeOffset,
    positionedOffset:       positionedOffset,
    cumulativeScrollOffset: cumulativeScrollOffset,
    viewportOffset:         viewportOffset,
    absolutize:             absolutize,
    relativize:             relativize
  });

  function isBody(element) {
    return element.nodeName.toUpperCase() === 'BODY';
  }

  function isDetached(element) {
    return element !== document.body &&
     !Element.descendantOf(element, document.body);
  }

  if ('getBoundingClientRect' in document.documentElement) {
    Element.addMethods({
      viewportOffset: function(element) {
        element = $(element);
        if (isDetached(element)) return new Element.Offset(0, 0);

        var rect  = element.getBoundingClientRect(),
         docEl = document.documentElement;
        return new Element.Offset(rect.left - docEl.clientLeft,
         rect.top - docEl.clientTop);
      },

      positionedOffset: function(element) {
        element = $(element);
        var parent = element.getOffsetParent();
        if (isDetached(element)) return new Element.Offset(0, 0);

        if (element.offsetParent &&
         element.offsetParent.nodeName.toUpperCase() === 'HTML') {
          return positionedOffset(element);
        }

        var eOffset = element.viewportOffset(),
         pOffset = isBody(parent) ? viewportOffset(parent) :
          parent.viewportOffset();
        var retOffset = eOffset.relativeTo(pOffset);

        var layout = element.getLayout();
        var top  = retOffset.top  - layout.get('margin-top');
        var left = retOffset.left - layout.get('margin-left');

        return new Element.Offset(left, top);
      }
    });
  }
})();
window.$$ = function() {
  var expression = $A(arguments).join(', ');
  return Prototype.Selector.select(expression, document);
};

Prototype.Selector = (function() {

  function select() {
    throw new Error('Method "Prototype.Selector.select" must be defined.');
  }

  function match() {
    throw new Error('Method "Prototype.Selector.match" must be defined.');
  }

  function find(elements, expression, index) {
    index = index || 0;
    var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

    for (i = 0; i < length; i++) {
      if (match(elements[i], expression) && index == matchIndex++) {
        return Element.extend(elements[i]);
      }
    }
  }

  function extendElements(elements) {
    for (var i = 0, length = elements.length; i < length; i++) {
      Element.extend(elements[i]);
    }
    return elements;
  }


  var K = Prototype.K;

  return {
    select: select,
    match: match,
    find: find,
    extendElements: (Element.extend === K) ? K : extendElements,
    extendElement: Element.extend
  };
})();
Prototype._original_property = window.Sizzle;
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];

		parts.push( m[1] );

		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;

		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");

			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}

			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}

					var doneName = match[0],
						parent = elem.parentNode;

					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						}
						parent.sizcache = doneName;
					}

					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}

	return array;
};

try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 );

} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return 0;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

(function(){
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){

	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}

	Sizzle = function(query, context, extra, seed){
		context = context || document;

		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}

		return oldSizzle(query, context, extra, seed);
	};

	for ( var prop in oldSizzle ) {
		Sizzle[ prop ] = oldSizzle[ prop ];
	}

	div = null; // release memory in IE
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	if ( div.getElementsByClassName("e").length === 0 )
		return;

	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};


window.Sizzle = Sizzle;

})();

;(function(engine) {
  var extendElements = Prototype.Selector.extendElements;

  function select(selector, scope) {
    return extendElements(engine(selector, scope || document));
  }

  function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
  }

  Prototype.Selector.engine = engine;
  Prototype.Selector.select = select;
  Prototype.Selector.match = match;
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

var Form = {
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  serializeElements: function(elements, options) {
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit, accumulator, initial;

    if (options.hash) {
      initial = {};
      accumulator = function(result, key, value) {
        if (key in result) {
          if (!Object.isArray(result[key])) result[key] = [result[key]];
          result[key].push(value);
        } else result[key] = value;
        return result;
      };
    } else {
      initial = '';
      accumulator = function(result, key, value) {
        return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }

    return elements.inject(initial, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          result = accumulator(result, key, value);
        }
      }
      return result;
    });
  }
};

Form.Methods = {
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, value) {
    if (Object.isUndefined(value))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = value.include(currentValue);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
(function() {

  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };

  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;

  var _isButton;
  if (Prototype.Browser.IE) {
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    _isButton = function(event, code) {
      return event.button === buttonMap[code];
    };
  } else if (Prototype.Browser.WebKit) {
    _isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };
  } else {
    _isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  function isLeftClick(event)   { return _isButton(event, 0) }

  function isMiddleClick(event) { return _isButton(event, 1) }

  function isRightClick(event)  { return _isButton(event, 2) }

  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  function findElement(event, expression) {
    var element = Event.element(event);
    if (!expression) return element;
    while (element) {
      if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
        return Element.extend(element);
      }
      element = element.parentNode;
    }
  }

  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }

  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
  }


  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    event.stopped = true;
  }

  Event.Methods = {
    isLeftClick: isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick: isRightClick,

    element: element,
    findElement: findElement,

    pointer: pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };


  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover': element = event.fromElement; break;
        case 'mouseout':  element = event.toElement;   break;
        default: return null;
      }
      return Element.extend(element);
    }

    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    });

    Event.extend = function(event, element) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);

      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });

      return Object.extend(event, methods);
    };
  } else {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
    Event.extend = Prototype.K;
  }

  function _createResponder(element, eventName, handler) {
    var registry = Element.retrieve(element, 'prototype_event_registry');

    if (Object.isUndefined(registry)) {
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }

    if (respondersForEvent.pluck('handler').include(handler)) return false;

    var responder;
    if (eventName.include(":")) {
      responder = function(event) {
        if (Object.isUndefined(event.eventName))
          return false;

        if (event.eventName !== eventName)
          return false;

        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);

            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }

            if (parent === element) return;

            handler.call(element, event);
          };
        }
      } else {
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }

  function _destroyCache() {
    for (var i = 0, length = CACHE.length; i < length; i++) {
      Event.stopObserving(CACHE[i]);
      CACHE[i] = null;
    }
  }

  var CACHE = [];

  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);


  var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      return (translations[eventName] || eventName);
    };
  }

  function observe(element, eventName, handler) {
    element = $(element);

    var responder = _createResponder(element, eventName, handler);

    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.addEventListener)
        element.addEventListener("dataavailable", responder, false);
      else {
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onfilterchange", responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);

      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  function stopObserving(element, eventName, handler) {
    element = $(element);

    var registry = Element.retrieve(element, 'prototype_event_registry');
    if (!registry) return element;

    if (!eventName) {
      registry.each( function(pair) {
        var eventName = pair.key;
        stopObserving(element, eventName);
      });
      return element;
    }

    var responders = registry.get(eventName);
    if (!responders) return element;

    if (!handler) {
      responders.each(function(r) {
        stopObserving(element, eventName, r.handler);
      });
      return element;
    }

    var responder = responders.find( function(r) { return r.handler === handler; });
    if (!responder) return element;

    if (eventName.include(':')) {
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onfilterchange",  responder);
      }
    } else {
      var actualEventName = _getDOMEventName(eventName);
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }

    registry.set(eventName, responders.without(responder));

    return element;
  }

  function fire(element, eventName, memo, bubble) {
    element = $(element);

    if (Object.isUndefined(bubble))
      bubble = true;

    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', true, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onfilterchange';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }

  Event.Handler = Class.create({
    initialize: function(element, eventName, selector, callback) {
      this.element   = $(element);
      this.eventName = eventName;
      this.selector  = selector;
      this.callback  = callback;
      this.handler   = this.handleEvent.bind(this);
    },

    start: function() {
      Event.observe(this.element, this.eventName, this.handler);
      return this;
    },

    stop: function() {
      Event.stopObserving(this.element, this.eventName, this.handler);
      return this;
    },

    handleEvent: function(event) {
      var element = event.findElement(this.selector);
      if (element) this.callback.call(this.element, event, element);
    }
  });

  function on(element, eventName, selector, callback) {
    element = $(element);
    if (Object.isFunction(selector) && Object.isUndefined(callback)) {
      callback = selector, selector = null;
    }

    return new Event.Handler(element, eventName, selector, callback).start();
  }

  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving,
    on:            on
  });

  Element.addMethods({
    fire:          fire,

    observe:       observe,

    stopObserving: stopObserving,

    on:            on
  });

  Object.extend(document, {
    fire:          fire.methodize(),

    observe:       observe.methodize(),

    stopObserving: stopObserving.methodize(),

    on:            on.methodize(),

    loaded:        false
  });

  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
  Before: function(element, content) {
    return Element.insert(element, {before:content});
  },

  Top: function(element, content) {
    return Element.insert(element, {top:content});
  },

  Bottom: function(element, content) {
    return Element.insert(element, {bottom:content});
  },

  After: function(element, content) {
    return Element.insert(element, {after:content});
  }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
  includeScrollOffsets: false,

  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = Element.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = Element.cumulativeScrollOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = Element.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },


  cumulativeOffset: Element.Methods.cumulativeOffset,

  positionedOffset: Element.Methods.positionedOffset,

  absolutize: function(element) {
    Position.prepare();
    return Element.absolutize(element);
  },

  relativize: function(element) {
    Position.prepare();
    return Element.relativize(element);
  },

  realOffset: Element.Methods.cumulativeScrollOffset,

  offsetParent: Element.Methods.getOffsetParent,

  page: Element.Methods.viewportOffset,

  clone: function(source, target, options) {
    options = options || { };
    return Element.clonePosition(target, source, options);
  }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods){
  function iter(name) {
    return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
  }

  instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
    className = className.toString().strip();
    var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
    return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
    className = className.toString().strip();
    var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
    if (!classNames && !className) return elements;

    var nodes = $(element).getElementsByTagName('*');
    className = ' ' + className + ' ';

    for (var i = 0, child, cn; child = nodes[i]; i++) {
      if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
            return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
        elements.push(Element.extend(child));
    }
    return elements;
  };

  return function(className, parentElement) {
    return $(parentElement || document.body).getElementsByClassName(className);
  };
}(Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
  window.Selector = Class.create({
    initialize: function(expression) {
      this.expression = expression.strip();
    },

    findElements: function(rootElement) {
      return Prototype.Selector.select(this.expression, rootElement);
    },

    match: function(element) {
      return Prototype.Selector.match(element, this.expression);
    },

    toString: function() {
      return this.expression;
    },

    inspect: function() {
      return "#<Selector: " + this.expression + ">";
    }
  });

  Object.extend(Selector, {
    matchElements: function(elements, expression) {
      var match = Prototype.Selector.match,
          results = [];

      for (var i = 0, length = elements.length; i < length; i++) {
        var element = elements[i];
        if (match(element, expression)) {
          results.push(Element.extend(element));
        }
      }
      return results;
    },

    findElement: function(elements, expression, index) {
      index = index || 0;
      var matchIndex = 0, element;
      for (var i = 0, length = elements.length; i < length; i++) {
        element = elements[i];
        if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
          return Element.extend(element);
        }
      }
    },

    findChildElements: function(element, expressions) {
      var selector = expressions.toArray().join(', ');
      return Prototype.Selector.select(selector, element || document);
    }
  });
})();
/*!
 *  script.aculo.us version 2.0.0_a6
 *  (c) 2005-2010 Thomas Fuchs
 *
 *  script.aculo.us is freely distributable under the terms of an MIT-style license.
 *----------------------------------------------------------------------------------*/



var S2 = {
  Version: '2.0.0_a6',

  Extensions: {}
};


Function.prototype.optionize = function(){
  var self = this, argumentNames = self.argumentNames(), optionIndex = this.length - 1;

  var method = function() {
    var args = $A(arguments);

    var options = (typeof args.last() === 'object') ? args.pop() : {};
    var prefilledArgs = [];
    if (optionIndex > 0) {
      prefilledArgs = ((args.length > 0 ? args : [null]).inGroupsOf(
       optionIndex).flatten()).concat(options);
    }

    return self.apply(this, prefilledArgs);
  };
  method.argumentNames = function() { return argumentNames; };
  return method;
};

Function.ABSTRACT = function() {
  throw "Abstract method. Implement in subclass.";
};

Object.extend(Number.prototype, {
  constrain: function(n1, n2) {
    var min = (n1 < n2) ? n1 : n2;
    var max = (n1 < n2) ? n2 : n1;

    var num = Number(this);

    if (num < min) num = min;
    if (num > max) num = max;

    return num;
  },

  nearer: function(n1, n2) {
    var num = Number(this);

    var diff1 = Math.abs(num - n1);
    var diff2 = Math.abs(num - n2);

    return (diff1 < diff2) ? n1 : n2;
  },

  tween: function(target, position) {
    return this + (target-this) * position;
  }
});


Object.propertize = function(property, object){
  return Object.isString(property) ? object[property] : property;
};

S2.CSS = {
  PROPERTY_MAP: {
    backgroundColor: 'color',
    borderBottomColor: 'color',
    borderBottomWidth: 'length',
    borderLeftColor: 'color',
    borderLeftWidth: 'length',
    borderRightColor: 'color',
    borderRightWidth: 'length',
    borderSpacing: 'length',
    borderTopColor: 'color',
    borderTopWidth: 'length',
    bottom: 'length',
    color: 'color',
    fontSize: 'length',
    fontWeight: 'integer',
    height: 'length',
    left: 'length',
    letterSpacing: 'length',
    lineHeight: 'length',
    marginBottom: 'length',
    marginLeft: 'length',
    marginRight: 'length',
    marginTop: 'length',
    maxHeight: 'length',
    maxWidth: 'length',
    minHeight: 'length',
    minWidth: 'length',
    opacity: 'number',
    outlineColor: 'color',
    outlineOffset: 'length',
    outlineWidth: 'length',
    paddingBottom: 'length',
    paddingLeft: 'length',
    paddingRight: 'length',
    paddingTop: 'length',
    right: 'length',
    textIndent: 'length',
    top: 'length',
    width: 'length',
    wordSpacing: 'length',
    zIndex: 'integer',
    zoom: 'number'
  },

  VENDOR_MAP: {
    webkit: {
      DEFAULT: $w('border-radius box-shadow transform transition ' +
       'transition-duration transition-timing-function transition-property ' +
       'transition-delay ' +
       'border-top-left-radius border-top-right-radius border-bottom-left-radius ' +
       'border-bottom-right-radius'
      )
    },
    moz: {
      DEFAULT: $w('border-radius box-shadow transform transition ' +
       'transition-duration transition-timing-function transition-property ' +
       'transition-delay '
      ),
      'border-top-left-radius':     '-moz-border-radius-topleft',
      'border-top-right-radius':    '-moz-border-radius-topright',
      'border-bottom-left-radius':  '-moz-border-radius-bottomleft',
      'border-bottom-right-radius': '-moz-border-radius-bottomright'
    },

    o: {
    }
  },

  VENDOR_PREFIX: null,

  LENGTH: /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/,

  NUMBER: /([\+-]*\d+\.?\d*)/,

  __parseStyleElement: document.createElement('div'),

  parseStyle: function(styleString) {
    S2.CSS.__parseStyleElement.innerHTML = '<div style="' + styleString + '"></div>';
    var style = S2.CSS.__parseStyleElement.childNodes[0].style, styleRules = {};

    S2.CSS.NUMERIC_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = style[property];
    });

    S2.CSS.COLOR_PROPERTIES.each( function(property){
      if (style[property]) styleRules[property] = S2.CSS.colorFromString(style[property]);
    });

    if (Prototype.Browser.IE && styleString.include('opacity'))
      styleRules.opacity = styleString.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1];

    return styleRules;
  },

  parse: function(styleString) {
    return S2.CSS.parseStyle(styleString);
  },

  normalize: function(element, style) {
    if (Object.isHash(style)) style = style.toObject();
    if (typeof style === 'string') style = S2.CSS.parseStyle(style);

    var result = {}, current;

    for (var property in style) {
      current = element.getStyle(property);
      if (style[property] !== current) {
        result[property] = style[property];
      }
    }

    return result;
  },

  serialize: function(object) {
    if (Object.isHash(object)) object = object.toObject();
    var output = "", value;
    for (var property in object) {
      value = object[property];
      property = this.vendorizeProperty(property);
      output += (property + ": " + value + ';');
    }
    return output;
  },

  vendorizeProperty: function(property) {
    var prefix = S2.CSS.VENDOR_PREFIX;

    property = property.underscore().dasherize();

    if (prefix) {
      var table = S2.CSS.VENDOR_MAP[prefix.toLowerCase()];
      if (table.DEFAULT.include(property)) {
        property = prefix + '-' + property;
      } else if (table[property]) {
        property = table[property];
      }
    }

    if (property.match(/^(?:webkit|moz|ms|o|khtml)-/))
      property = '-' + property;

    return property;
  },

  normalizeColor: function(color) {
    if (!color || color == 'rgba(0, 0, 0, 0)' || color == 'transparent') color = '#ffffff';
    color = S2.CSS.colorFromString(color);
    return [
      parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)
    ];
  },

  colorFromString: function(color) {
    var value = '#', cols, i;
    if (color.slice(0,4) == 'rgb(') {
      cols = color.slice(4,color.length-1).split(',');
      i=3; while(i--) value += parseInt(cols[2-i]).toColorPart();
    } else if (color.slice(0,1) == '#') {
        if (color.length==4) for(i=1;i<4;i++) value += (color.charAt(i) + color.charAt(i)).toLowerCase();
        if (color.length==7) value = color.toLowerCase();
    } else { value = color; }
    return (value.length==7 ? value : (arguments[1] || value));
  },

  interpolateColor: function(from, to, position){
    from = S2.CSS.normalizeColor(from);
    to = S2.CSS.normalizeColor(to);

    return '#' + [0,1,2].map(function(index){
      return Math.max(Math.min(from[index].tween(to[index], position).round(), 255), 0).toColorPart();
    }).join('');
  },

  interpolateNumber: function(from, to, position){
    return 1*((from||0).tween(to, position).toFixed(3));
  },

  interpolateLength: function(from, to, position){
    if (!from || parseFloat(from) === 0) {
      from = '0' + to.gsub(S2.CSS.NUMBER,'');
    }
    to.scan(S2.CSS.NUMBER, function(match){ to = 1*(match[1]); });
    return from.gsub(S2.CSS.NUMBER, function(match){
      return (1*(parseFloat(match[1]).tween(to, position).toFixed(3))).toString();
    });
  },

  interpolateInteger: function(from, to, position){
    return parseInt(from).tween(to, position).round();
  },

  interpolate: function(property, from, to, position){
    return S2.CSS['interpolate'+S2.CSS.PROPERTY_MAP[property.camelize()].capitalize()](from, to, position);
  },

  ElementMethods: {
    getStyles: function(element) {
      var css = document.defaultView.getComputedStyle($(element), null);
      return S2.CSS.PROPERTIES.inject({ }, function(styles, property) {
        styles[property] = css[property];
        return styles;
      });
    }
  }
};

S2.CSS.PROPERTIES = [];
for (var property in S2.CSS.PROPERTY_MAP) S2.CSS.PROPERTIES.push(property);

S2.CSS.NUMERIC_PROPERTIES = S2.CSS.PROPERTIES.findAll(function(property){ return !property.endsWith('olor') });
S2.CSS.COLOR_PROPERTIES   = S2.CSS.PROPERTIES.findAll(function(property){ return property.endsWith('olor') });

if (!(document.defaultView && document.defaultView.getComputedStyle)) {
  S2.CSS.ElementMethods.getStyles = function(element) {
    element = $(element);
    var css = element.currentStyle, styles;
    styles = S2.CSS.PROPERTIES.inject({ }, function(hash, property) {
      hash[property] = css[property];
      return hash;
    });
    if (!styles.opacity) styles.opacity = element.getOpacity();
    return styles;
  };
};

Element.addMethods(S2.CSS.ElementMethods);

(function() {
  var div = document.createElement('div');
  var style = div.style, prefixes = $w('webkit Moz');

  var prefix = prefixes.detect( function(p) {
    return typeof style[p + 'BorderRadius'] !== 'undefined';
  });

  S2.CSS.VENDOR_PREFIX = prefix;

  div = null;
})();

S2.FX = (function(){
  var queues = [], globalQueue,
    heartbeat, activeEffects = 0;

  function beatOnDemand(dir) {
    activeEffects += dir;
    if (activeEffects > 0) heartbeat.start();
    else heartbeat.stop();
  }

  function renderQueues() {
    var timestamp = heartbeat.getTimestamp();
    for (var i = 0, queue; queue = queues[i]; i++) {
      queue.render(timestamp);
    }
  }

  function initialize(initialHeartbeat){
    if (globalQueue) return;
    queues.push(globalQueue = new S2.FX.Queue());
    S2.FX.DefaultOptions.queue = globalQueue;
    heartbeat = initialHeartbeat || new S2.FX.Heartbeat();

    document
      .observe('effect:heartbeat', renderQueues)
      .observe('effect:queued',    beatOnDemand.curry(1))
      .observe('effect:dequeued',  beatOnDemand.curry(-1));
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) timestamp = (new Date()).valueOf();
    var d = new Date(timestamp);
    return d.getSeconds() + '.' + d.getMilliseconds() + 's';
  }

  return {
    initialize:   initialize,
    getQueues:    function() { return queues; },
    addQueue:     function(queue) { queues.push(queue); },
    getHeartbeat: function() { return heartbeat; },
    setHeartbeat: function(newHeartbeat) { heartbeat = newHeartbeat; },
    formatTimestamp: formatTimestamp
  }
})();

Object.extend(S2.FX, {
  DefaultOptions: {
    transition: 'sinusoidal',
    position:   'parallel',
    fps:        60,
    duration:   .2
  },

  elementDoesNotExistError: {
    name: 'ElementDoesNotExistError',
    message: 'The specified DOM element does not exist, but is required for this effect to operate'
  },

  parseOptions: function(options) {
    if (Object.isNumber(options))
      options = { duration: options };
    else if (Object.isFunction(options))
      options = { after: options };
    else if (Object.isString(options))
      options = { duration: options == 'slow' ? 1 : options == 'fast' ? .1 : .2 };

    return options || {};
  },

  ready: function(element) {
    var table = this._ready;
    var uid = element._prototypeUID;
    if (!uid) return true;

    bool = table[uid];
    return Object.isUndefined(bool) ? true : bool;
  },

  setReady: function(element, bool) {
    var table = this._ready;
    var uid = element._prototypeUID;
    if (!uid) {
      element.getStorage();
      uid = element._prototypeUID;
    }

    table[uid] = bool;
  },

  _ready: {}
});

S2.FX.Base = Class.create({
  initialize: function(options) {
    S2.FX.initialize();
    this.updateWithoutWrappers = this.update;

    if(options && options.queue && !S2.FX.getQueues().include(options.queue))
      S2.FX.addQueue(options.queue);

    this.setOptions(options);
    this.duration = this.options.duration*1000;
    this.state = 'idle';

    ['after','before'].each(function(method) {
      this[method] = function(method) {
        method(this);
        return this;
      }
    }, this);
  },

  setOptions: function(options) {
    options = S2.FX.parseOptions(options);

    this.options = Object.extend(this.options || Object.extend({}, S2.FX.DefaultOptions), options);

    if (options.tween) this.options.transition = options.tween;

    if (this.options.beforeUpdate || this.options.afterUpdate) {
      this.update = this.updateWithoutWrappers.wrap( function(proceed,position){
        if (this.options.beforeUpdate) this.options.beforeUpdate(this, position);
        proceed(position);
        if (this.options.afterUpdate) this.options.afterUpdate(this, position);
      }.bind(this));
    }

    if (this.options.transition === false)
      this.options.transition = S2.FX.Transitions.linear;

    this.options.transition = Object.propertize(this.options.transition, S2.FX.Transitions);
  },

  play: function(options) {
    this.setOptions(options);
    this.frameCount = 0;
    this.state = 'idle';
    this.options.queue.add(this);
    this.maxFrames = this.options.fps * this.duration / 1000;
    return this;
  },

  render: function(timestamp) {
    if (this.options.debug) {
    }
    if (timestamp >= this.startsAt) {
      if (this.state == 'idle' && S2.FX.ready(this.element)) {
        this.debug('starting the effect at ' + S2.FX.formatTimestamp(timestamp));
        this.endsAt = this.startsAt + this.duration;
        this.start();
        this.frameCount++;
        return this;
      }

      if (timestamp >= this.endsAt && this.state !== 'finished') {
        this.debug('stopping the effect at ' + S2.FX.formatTimestamp(timestamp));
        this.finish();
        return this;
      }

      if (this.state === 'running') {
        var position = 1 - (this.endsAt - timestamp) / this.duration;
        if ((this.maxFrames * position).floor() > this.frameCount) {
          this.update(this.options.transition(position));
          this.frameCount++;
        }
      }
    }
    return this;
  },

  start: function() {
    if (this.options.before) this.options.before(this);
    if (this.setup) this.setup();
    this.state = 'running';
    this.update(this.options.transition(0));
  },

  cancel: function(after) {
    if (this.state !== 'running') return;
    if (this.teardown) this.teardown();
    if (after && this.options.after) this.options.after(this);
    this.state = 'finished';
  },

  finish: function() {
    if (this.state !== 'running') return;
    this.update(this.options.transition(1));
    this.cancel(true);
  },

  inspect: function() {
    return '#<S2.FX:' + [this.state, this.startsAt, this.endsAt].inspect() + '>';
  },

  update: Prototype.emptyFunction,

  debug: function(message) {
    if (!this.options.debug) return;
    if (window.console && console.log) {
      console.log(message);
    }
  }
});

S2.FX.Element = Class.create(S2.FX.Base, {
  initialize: function($super, element, options) {
    if(!(this.element = $(element)))
      throw(S2.FX.elementDoesNotExistError);
    this.operators = [];
    return $super(options);
  },

  animate: function() {
    var args = $A(arguments), operator =  args.shift();
    operator = operator.charAt(0).toUpperCase() + operator.substring(1);
    this.operators.push(new S2.FX.Operators[operator](this, args[0], args[1] || {}));
  },

  play: function($super, element, options) {
    if (element) this.element = $(element);
    this.operators = [];
    return $super(options);
  },

  update: function(position) {
    for (var i = 0, operator; operator = this.operators[i]; i++) {
      operator.render(position);
    }
  }
});
S2.FX.Heartbeat = Class.create({
  initialize: function(options) {
    this.options = Object.extend({
      framerate: Prototype.Browser.MobileSafari ? 20 : 60
    }, options);
    this.beat = this.beat.bind(this);
  },

  start: function() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval =
      setInterval(this.beat, 1000/this.options.framerate);
    this.updateTimestamp();
  },

  stop: function() {
    if (!this.heartbeatInterval) return;
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
    this.timestamp = null;
  },

  beat: function() {
    this.updateTimestamp();
    document.fire('effect:heartbeat');
  },

  getTimestamp: function() {
    return this.timestamp || this.generateTimestamp();
  },

  generateTimestamp: function() {
    return new Date().getTime();
  },

  updateTimestamp: function() {
    this.timestamp = this.generateTimestamp();
  }
});
S2.FX.Queue = (function(){
  return function() {
    var instance = this;
    var effects = [];

    function getEffects() {
      return effects;
    }

    function active() {
      return effects.length > 0;
    }

    function add(effect) {
      calculateTiming(effect);
      effects.push(effect);
      document.fire('effect:queued', instance);
      return instance;
    }

    function remove(effect) {
      effects = effects.without(effect);
      document.fire('effect:dequeued', instance);
      delete effect;
      return instance;
    }

    function render(timestamp) {
      for (var i = 0, effect; effect = effects[i]; i++) {
        effect.render(timestamp);
        if (effect.state === 'finished') remove(effect);
      }

      return instance;
    }

    function calculateTiming(effect) {
      var position = effect.options.position || 'parallel',
        now = S2.FX.getHeartbeat().getTimestamp();

      var startsAt;
      if (position === 'end') {
        startsAt = effects.without(effect).pluck('endsAt').max() || now;
        if (startsAt < now) startsAt = now;
      } else {
        startsAt = now;
      }

      var delay = (effect.options.delay || 0) * 1000;
      effect.startsAt = startsAt + delay;

      var duration = (effect.options.duration || 1) * 1000;
      effect.endsAt = effect.startsAt + duration;
    }

    Object.extend(instance, {
      getEffects: getEffects,
      active: active,
      add: add,
      remove: remove,
      render: render
    });
  }
})();

S2.FX.Attribute = Class.create(S2.FX.Base, {
  initialize: function($super, object, from, to, options, method) {
    object = Object.isString(object) ? $(object) : object;

    this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };

    this.to = to;
    this.from = from;

    return $super(options);
  },

  update: function(position) {
    this.method(this.from.tween(this.to, position));
  }
});
S2.FX.Style = Class.create(S2.FX.Element, {
  setup: function() {
    this.animate('style', this.element, { style: this.options.style });
  }
});
S2.FX.Operators = { };

S2.FX.Operators.Base = Class.create({
  initialize: function(effect, object, options) {
    this.effect = effect;
    this.object = object;
    this.options = Object.extend({
      transition: Prototype.K
    }, options);
  },

  inspect: function() {
    return "#<S2.FX.Operators.Base:" + this.lastValue + ">";
  },

  setup: function() {
  },

  valueAt: function(position) {
  },

  applyValue: function(value) {
  },

  render: function(position) {
    var value = this.valueAt(this.options.transition(position));
    this.applyValue(value);
    this.lastValue = value;
  }
});

S2.FX.Operators.Style = Class.create(S2.FX.Operators.Base, {
  initialize: function($super, effect, object, options) {
    $super(effect, object, options);
    this.element = $(this.object);

    this.style = Object.isString(this.options.style) ?
      S2.CSS.parseStyle(this.options.style) : this.options.style;

    var translations = this.options.propertyTransitions || {};

    this.tweens = [];

    for (var item in this.style) {
      var property = item.underscore().dasherize(),
       from = this.element.getStyle(property), to = this.style[item];

      if (from != to) {
        this.tweens.push([
          property,
          S2.CSS.interpolate.curry(property, from, to),
          item in translations ?
           Object.propertize(translations[item], S2.FX.Transitions) :
           Prototype.K
        ]);
      }
    }
  },

  valueAt: function(position) {
    return this.tweens.map( function(tween){
      return tween[0] + ':' + tween[1](tween[2](position));
    }).join(';');
  },

  applyValue: function(value) {
    if (this.currentStyle == value) return;
    this.element.setStyle(value);
    this.currentStyle = value;
  }
});

S2.FX.Morph = Class.create(S2.FX.Element, {
  setup: function() {
    if (this.options.change)
      this.setupWrappers();
    else if (this.options.style)
      this.animate('style', this.destinationElement || this.element, {
        style: this.options.style,
        propertyTransitions: this.options.propertyTransitions || { }
      });
  },

  teardown: function() {
    if (this.options.change)
      this.teardownWrappers();
  },

  setupWrappers: function() {
    var elementFloat = this.element.getStyle("float"),
      sourceHeight, sourceWidth,
      destinationHeight, destinationWidth,
      maxHeight;

    this.transitionElement = new Element('div').setStyle({ position: "relative", overflow: "hidden", 'float': elementFloat });
    this.element.setStyle({ 'float': "none" }).insert({ before: this.transitionElement });

    this.sourceElementWrapper = this.element.cloneWithoutIDs().wrap('div');
    this.destinationElementWrapper = this.element.wrap('div');

    this.transitionElement.insert(this.sourceElementWrapper).insert(this.destinationElementWrapper);

    sourceHeight = this.sourceElementWrapper.getHeight();
    sourceWidth = this.sourceElementWrapper.getWidth();

    this.options.change();

    destinationHeight = this.destinationElementWrapper.getHeight();
    destinationWidth  = this.destinationElementWrapper.getWidth();

    this.outerWrapper = new Element("div");
    this.transitionElement.insert({ before: this.outerWrapper });
    this.outerWrapper.setStyle({
      overflow: "hidden", height: sourceHeight + "px", width: sourceWidth + "px"
    }).appendChild(this.transitionElement);

    maxHeight = Math.max(destinationHeight, sourceHeight), maxWidth = Math.max(destinationWidth, sourceWidth);

    this.transitionElement.setStyle({ height: sourceHeight + "px", width: sourceWidth + "px" });
    this.sourceElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0 });
    this.destinationElementWrapper.setStyle({ position: "absolute", height: maxHeight + "px", width: maxWidth + "px", top: 0, left: 0, opacity: 0, zIndex: 2000 });

    this.outerWrapper.insert({ before: this.transitionElement }).remove();

    this.animate('style', this.transitionElement, { style: 'height:' + destinationHeight + 'px; width:' + destinationWidth + 'px' });
    this.animate('style', this.destinationElementWrapper, { style: 'opacity: 1.0' });
  },

  teardownWrappers: function() {
    var destinationElement = this.destinationElementWrapper.down();

    if (destinationElement)
      this.transitionElement.insert({ before: destinationElement });

    this.transitionElement.remove();
  }
});
S2.FX.Parallel = Class.create(S2.FX.Base, {
  initialize: function($super, effects, options) {
    this.effects = effects || [];
    return $super(options || {});
  },

  setup: function() {
    this.effects.invoke('setup');
  },

  update: function(position) {
    this.effects.invoke('update', position);
  }
});

S2.FX.Operators.Scroll = Class.create(S2.FX.Operators.Base, {
  initialize: function($super, effect, object, options) {
    $super(effect, object, options);
    this.start = object.scrollTop;
    this.end = this.options.scrollTo;
  },

  valueAt: function(position) {
    return this.start + ((this.end - this.start)*position);
  },

  applyValue: function(value){
    this.object.scrollTop = value.round();
  }
});

S2.FX.Scroll = Class.create(S2.FX.Element, {
  setup: function() {
    this.animate('scroll', this.element, { scrollTo: this.options.to });
  }
});

S2.FX.SlideDown = Class.create(S2.FX.Element, {
  setup: function() {
    var element = this.destinationElement || this.element;
    var layout = element.getLayout();

    var style = {
      height:        layout.get('height') + 'px',
      paddingTop:    layout.get('padding-top') + 'px',
      paddingBottom: layout.get('padding-bottom') + 'px'
    };

    element.setStyle({
      height:         '0',
      paddingTop:     '0',
      paddingBottom:  '0',
      overflow:       'hidden'
    }).show();

    this.animate('style', element, {
      style: style,
      propertyTransitions: {}
    });
  },

  teardown: function() {
    var element = this.destinationElement || this.element;
    element.setStyle({
      height:         '',
      paddingTop:     '',
      paddingBottom:  '',
      overflow:       'visible'
    });
  }
});

S2.FX.SlideUp = Class.create(S2.FX.Morph, {
  setup: function() {
    var element = this.destinationElement || this.element;
    var layout = element.getLayout();

    var style = {
      height:        '0px',
      paddingTop:    '0px',
      paddingBottom: '0px'
    };

    element.setStyle({ overflow: 'hidden' });

    this.animate('style', element, {
      style: style,
      propertyTransitions: {}
    });
  },

  teardown: function() {
    var element = this.destinationElement || this.element;
    element.setStyle({
      height:         '',
      paddingTop:     '',
      paddingBottom:  '',
      overflow:       'visible'
    }).hide();
  }
});


S2.FX.Transitions = {

  linear: Prototype.K,

  sinusoidal: function(pos) {
    return (-Math.cos(pos*Math.PI)/2) + 0.5;
  },

  reverse: function(pos) {
    return 1 - pos;
  },

  mirror: function(pos, transition) {
    transition = transition || S2.FX.Transitions.sinusoidal;
    if(pos<0.5)
      return transition(pos*2);
    else
      return transition(1-(pos-0.5)*2);
  },

  flicker: function(pos) {
    var pos = pos + (Math.random()-0.5)/5;
    return S2.FX.Transitions.sinusoidal(pos < 0 ? 0 : pos > 1 ? 1 : pos);
  },

  wobble: function(pos) {
    return (-Math.cos(pos*Math.PI*(9*pos))/2) + 0.5;
  },

  pulse: function(pos, pulses) {
    return (-Math.cos((pos*((pulses||5)-.5)*2)*Math.PI)/2) + .5;
  },

  blink: function(pos, blinks) {
    return Math.round(pos*(blinks||5)) % 2;
  },

  spring: function(pos) {
    return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
  },

  none: Prototype.K.curry(0),

  full: Prototype.K.curry(1)
};

/*!
 *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice,
 *  this list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation
 *  and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder(s) nor the names of any
 *  contributors may be used to endorse or promote products derived from
 *  this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 *  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 *  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function(){
  function CubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
    var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
    function sampleCurveX(t) {return ((ax*t+bx)*t+cx)*t;};
    function sampleCurveY(t) {return ((ay*t+by)*t+cy)*t;};
    function sampleCurveDerivativeX(t) {return (3.0*ax*t+2.0*bx)*t+cx;};
    function solveEpsilon(duration) {return 1.0/(200.0*duration);};
    function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));};
    function fabs(n) {if(n>=0) {return n;}else {return 0-n;}};
    function solveCurveX(x,epsilon) {
      var t0,t1,t2,x2,d2,i;
      for(t2=x, i=0; i<8; i++) {x2=sampleCurveX(t2)-x; if(fabs(x2)<epsilon) {return t2;} d2=sampleCurveDerivativeX(t2); if(fabs(d2)<1e-6) {break;} t2=t2-x2/d2;}
      t0=0.0; t1=1.0; t2=x; if(t2<t0) {return t0;} if(t2>t1) {return t1;}
      while(t0<t1) {x2=sampleCurveX(t2); if(fabs(x2-x)<epsilon) {return t2;} if(x>x2) {t0=t2;}else {t1=t2;} t2=(t1-t0)*.5+t0;}
      return t2; // Failure.
    };
    cx=3.0*p1x; bx=3.0*(p2x-p1x)-cx; ax=1.0-cx-bx; cy=3.0*p1y; by=3.0*(p2y-p1y)-cy; ay=1.0-cy-by;
    return solve(t, solveEpsilon(duration));
  }
  S2.FX.cubicBezierTransition = function(x1, y1, x2, y2){
    return (function(pos){
      return CubicBezierAtTime(pos,x1,y1,x2,y2,1);
    });
  }
})();

S2.FX.Transitions.webkitCubic =
  S2.FX.cubicBezierTransition(0.25,0.1,0.25,1);
S2.FX.Transitions.webkitEaseInOut =
  S2.FX.cubicBezierTransition(0.42,0.0,0.58,1.0);

/*!
 *  TERMS OF USE - EASING EQUATIONS
 *  Open source under the BSD License.
 *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
 */

Object.extend(S2.FX.Transitions, {
  easeInQuad: function(pos){
     return Math.pow(pos, 2);
  },

  easeOutQuad: function(pos){
    return -(Math.pow((pos-1), 2) -1);
  },

  easeInOutQuad: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,2);
    return -0.5 * ((pos-=2)*pos - 2);
  },

  easeInCubic: function(pos){
    return Math.pow(pos, 3);
  },

  easeOutCubic: function(pos){
    return (Math.pow((pos-1), 3) +1);
  },

  easeInOutCubic: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,3);
    return 0.5 * (Math.pow((pos-2),3) + 2);
  },

  easeInQuart: function(pos){
    return Math.pow(pos, 4);
  },

  easeOutQuart: function(pos){
    return -(Math.pow((pos-1), 4) -1)
  },

  easeInOutQuart: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  easeInQuint: function(pos){
    return Math.pow(pos, 5);
  },

  easeOutQuint: function(pos){
    return (Math.pow((pos-1), 5) +1);
  },

  easeInOutQuint: function(pos){
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,5);
    return 0.5 * (Math.pow((pos-2),5) + 2);
  },

  easeInSine: function(pos){
    return -Math.cos(pos * (Math.PI/2)) + 1;
  },

  easeOutSine: function(pos){
    return Math.sin(pos * (Math.PI/2));
  },

  easeInOutSine: function(pos){
    return (-.5 * (Math.cos(Math.PI*pos) -1));
  },

  easeInExpo: function(pos){
    return (pos==0) ? 0 : Math.pow(2, 10 * (pos - 1));
  },

  easeOutExpo: function(pos){
    return (pos==1) ? 1 : -Math.pow(2, -10 * pos) + 1;
  },

  easeInOutExpo: function(pos){
    if(pos==0) return 0;
    if(pos==1) return 1;
    if((pos/=0.5) < 1) return 0.5 * Math.pow(2,10 * (pos-1));
    return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
  },

  easeInCirc: function(pos){
    return -(Math.sqrt(1 - (pos*pos)) - 1);
  },

  easeOutCirc: function(pos){
    return Math.sqrt(1 - Math.pow((pos-1), 2))
  },

  easeInOutCirc: function(pos){
    if((pos/=0.5) < 1) return -0.5 * (Math.sqrt(1 - pos*pos) - 1);
    return 0.5 * (Math.sqrt(1 - (pos-=2)*pos) + 1);
  },

  easeOutBounce: function(pos){
    if ((pos) < (1/2.75)) {
      return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
      return (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
      return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
      return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },

  easeInBack: function(pos){
    var s = 1.70158;
    return (pos)*pos*((s+1)*pos - s);
  },

  easeOutBack: function(pos){
    var s = 1.70158;
    return (pos=pos-1)*pos*((s+1)*pos + s) + 1;
  },

  easeInOutBack: function(pos){
    var s = 1.70158;
    if((pos/=0.5) < 1) return 0.5*(pos*pos*(((s*=(1.525))+1)*pos -s));
    return 0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos +s) +2);
  },

  elastic: function(pos) {
    return -1 * Math.pow(4,-8*pos) * Math.sin((pos*6-1)*(2*Math.PI)/2) + 1;
  },

  swingFromTo: function(pos) {
    var s = 1.70158;
    return ((pos/=0.5) < 1) ? 0.5*(pos*pos*(((s*=(1.525))+1)*pos - s)) :
      0.5*((pos-=2)*pos*(((s*=(1.525))+1)*pos + s) + 2);
  },

  swingFrom: function(pos) {
    var s = 1.70158;
    return pos*pos*((s+1)*pos - s);
  },

  swingTo: function(pos) {
    var s = 1.70158;
    return (pos-=1)*pos*((s+1)*pos + s) + 1;
  },

  bounce: function(pos) {
    if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
        return (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
        return (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
        return (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },

  bouncePast: function(pos) {
    if (pos < (1/2.75)) {
        return (7.5625*pos*pos);
    } else if (pos < (2/2.75)) {
        return 2 - (7.5625*(pos-=(1.5/2.75))*pos + .75);
    } else if (pos < (2.5/2.75)) {
        return 2 - (7.5625*(pos-=(2.25/2.75))*pos + .9375);
    } else {
        return 2 - (7.5625*(pos-=(2.625/2.75))*pos + .984375);
    }
  },

  easeFromTo: function(pos) {
    if ((pos/=0.5) < 1) return 0.5*Math.pow(pos,4);
    return -0.5 * ((pos-=2)*Math.pow(pos,3) - 2);
  },

  easeFrom: function(pos) {
    return Math.pow(pos,4);
  },

  easeTo: function(pos) {
    return Math.pow(pos,0.25);
  }
});
(function(FX) {

  Hash.addMethods({
    hasKey: function(key) {
      return (key in this._object);
    }
  });

  var supported = false;
  var hardwareAccelerationSupported = false;

  function isHWAcceleratedSafari() {
    var ua = navigator.userAgent, av = navigator.appVersion;
    return (!ua.include('Chrome') && av.include('10_6')) ||
     Prototype.Browser.MobileSafari;
  }

  (function() {
    var div = document.createElement('div');

    try {
      document.createEvent("WebKitTransitionEvent");
      supported = true;

      hardwareAccelerationSupported = isHWAcceleratedSafari();
    } catch(e) {
      if (typeof div.style.MozTransition !== 'undefined') {
        supported = true;
      }
    }

    div = null;
  })();

  if (!supported) return;


  Prototype.BrowserFeatures.CSSTransitions = true;
  S2.Extensions.CSSTransitions = true;
  S2.Extensions.HardwareAcceleratedCSSTransitions = hardwareAccelerationSupported;

  if (hardwareAccelerationSupported) {
    Object.extend(FX.DefaultOptions, { accelerate: true });
  }

  function v(prop) {
    return S2.CSS.vendorizeProperty(prop);
  }

  var CSS_TRANSITIONS_PROPERTIES = $w(
   'border-top-left-radius border-top-right-radius ' +
   'border-bottom-left-radius border-bottom-right-radius ' +
   'background-size transform'
  ).map( function(prop) {
    return v(prop).camelize();
  });

  CSS_TRANSITIONS_PROPERTIES.each(function(property) {
    S2.CSS.PROPERTIES.push(property);
  });

  S2.CSS.NUMERIC_PROPERTIES = S2.CSS.PROPERTIES.findAll(function(property) {
    return !property.endsWith('olor')
  });

  CSS_TRANSITIONS_HARDWARE_ACCELERATED_PROPERTIES =
   S2.Extensions.HardwareAcceleratedCSSTransitions ?
    $w('top left bottom right opacity') : [];

  var TRANSLATE_TEMPLATE = new Template("translate(#{0}px, #{1}px)");


  var Operators = FX.Operators;

  Operators.CssTransition = Class.create(Operators.Base, {
    initialize: function($super, effect, object, options) {
      $super(effect, object, options);
      this.element = $(this.object);

      var style = this.options.style;

      this.style = Object.isString(style) ?
       S2.CSS.normalize(this.element, style) : style;

      this.style = $H(this.style);

      this.targetStyle = S2.CSS.serialize(this.style);
      this.running = false;
    },

    _canHardwareAccelerate: function() {
      if (this.effect.options.accelerate === false) return false;

      var style = this.style.toObject(), keys = this.style.keys();
      var element = this.element;

      if (keys.length === 0) return false;

      var otherPropertyExists = keys.any( function(key) {
        return !CSS_TRANSITIONS_HARDWARE_ACCELERATED_PROPERTIES.include(key);
      });

      if (otherPropertyExists) return false;

      var currentStyles = {
        left:   element.getStyle('left'),
        right:  element.getStyle('right'),
        top:    element.getStyle('top'),
        bottom: element.getStyle('bottom')
      };

      function hasTwoPropertiesOnSameAxis(obj) {
        if (obj.top && obj.bottom) return true;
        if (obj.left && obj.right) return true;
        return false;
      }

      if (hasTwoPropertiesOnSameAxis(currentStyles)) return false;
      if (hasTwoPropertiesOnSameAxis(style))         return false;

      return true;
    },

    _adjustForHardwareAcceleration: function(style) {
      var dx = 0, dy = 0;

      $w('top bottom left right').each( function(prop) {
        if (!style.hasKey(prop)) return;
        var current = window.parseInt(this.element.getStyle(prop), 10);
        var target  = window.parseInt(style.get(prop), 10);

        if (prop === 'top') {
          dy += (target - current);
        } else if (prop === 'bottom') {
          dy += (current - target);
        } else if (prop === 'left') {
          dx += (target - current);
        } else if (prop === 'right') {
          dx += (current - target);
        }

        style.unset(prop);
      }, this);

      var transformProperty = v('transform');

      if (dx !== 0 || dy !== 0) {
        var translation = TRANSLATE_TEMPLATE.evaluate([dx, dy]);
        style.set(transformProperty, translation);
      }

      this.targetStyle += transformProperty + ': translate(0px, 0px);';
      return style;
    },

    render: function() {
      if (this.running === true) return;
      var style = this.style.clone(), effect = this.effect;
      if (this._canHardwareAccelerate()) {
        effect.accelerated = true;
        style = this._adjustForHardwareAcceleration(style);
      } else {
        effect.accelerated = false;
      }

      var s = this.element.style;

      var original = {};
      $w('transition-property transition-duration transition-timing-function').each( function(prop) {
        prop = v(prop).camelize();
        original[prop] = s[prop];
      });

      this.element.store('s2.targetStyle', this.targetStyle);

      this.element.store('s2.originalTransitionStyle', original);

      s[v('transition-property').camelize()] = style.keys().join(',');
      s[v('transition-duration').camelize()] = (effect.duration / 1000).toFixed(3) + 's';
      s[v('transition-timing-function').camelize()] = timingFunctionForTransition(effect.options.transition);

      this.element.setStyle(style.toObject());
      this.running = true;

      this.render = Prototype.emptyFunction;
    }
  });

  Operators.CssTransition.TIMING_MAP = {
    linear:     'linear',
    sinusoidal: 'ease-in-out'
  };

  function timingFunctionForTransition(transition) {
    var timing = null, MAP = FX.Operators.CssTransition.TIMING_MAP;

    for (var t in MAP) {
      if (FX.Transitions[t] === transition) {
        timing = MAP[t];
        break;
      }
    }
    return timing;
  }

  function isCSSTransitionCompatible(effect) {
    if (!S2.Extensions.CSSTransitions) return false;
    var opt = effect.options;

    if ((opt.engine || '') === 'javascript') return false;

    if (!timingFunctionForTransition(opt.transition)) return false;

    if (opt.propertyTransitions) return false;

    return true;
  };

  FX.Morph = Class.create(FX.Morph, {
    setup: function() {
      if (this.options.change) {
        this.setupWrappers();
      } else if (this.options.style) {
        this.engine  = 'javascript';
        var operator = 'style';

        var style = Object.isString(this.options.style) ?
         S2.CSS.parseStyle(this.options.style) : style;

        var normalizedStyle = S2.CSS.normalize(
         this.destinationElement || this.element, style);

        var changesStyle = Object.keys(normalizedStyle).length > 0;

        if (changesStyle && isCSSTransitionCompatible(this)) {
          this.engine = 'css-transition';
          operator    = 'CssTransition';

          this.update = function(position) {
            this.element.store('s2.effect', this);

            S2.FX.setReady(this.element, false);

            for (var i = 0, operator; operator = this.operators[i]; i++) {
              operator.render(position);
            }

            this.render = Prototype.emptyFunction;
          }
        }

        this.animate(operator, this.destinationElement || this.element, {
          style: this.options.style,
          propertyTransitions: this.options.propertyTransitions || { }
        });
      }
    }
  });

  var EVENT_NAMES = {
    "webkit": "webkitTransitionEnd",
    "moz": "transitionend"
  };

  var eventName = EVENT_NAMES[S2.CSS.VENDOR_PREFIX.toLowerCase()];

  document.observe(eventName, function(event) {
    var element = event.element();
    if (!element) return;

    var effect = element.retrieve('s2.effect');

    function adjust(element, effect) {
      var targetStyle = element.retrieve('s2.targetStyle');
      if (!targetStyle) return;

      element.setStyle(targetStyle);

      var originalTransitionStyle =
       element.retrieve('s2.originalTransitionStyle');

      var storage = element.getStorage();
      storage.unset('s2.targetStyle');
      storage.unset('s2.originalTransitionStyle');
      storage.unset('s2.effect');

      (function() {
        if (originalTransitionStyle) {
          element.setStyle(originalTransitionStyle);
        }
        S2.FX.setReady(element);
      }).defer();
    }

    (function (element, effect) {
      var durationProperty = v('transition-duration').camelize();
      element.style[durationProperty] = '';

      adjust(element, effect);
    }).defer(element, effect);

    effect.state = 'finished';

    var after = effect.options.after;
    if (after) after(effect);
  });
})(S2.FX);

Element.__scrollTo = Element.scrollTo;
Element.addMethods({
  scrollTo: function(element, to, options){
    if(arguments.length == 1) return Element.__scrollTo(element);
    new S2.FX.Scroll(element, Object.extend(options || {}, { to: to })).play();
    return element;
  }
});

Element.addMethods({
  effect: function(element, effect, options){
    if (Object.isFunction(effect))
      effect = new effect(element, options);
    else if (Object.isString(effect))
      effect = new S2.FX[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
    effect.play(element, options);
    return element;
  },

  morph: function(element, style, options) {
    options = S2.FX.parseOptions(options);
    if (!options.queue) {
      options.queue = element.retrieve('S2.FX.Queue');
      if (!options.queue) {
        element.store('S2.FX.Queue', options.queue = new S2.FX.Queue());
      }
    }
    if (!options.position) options.position = 'end';
    return element.effect('morph', Object.extend(options, { style: style }));
  }.optionize(),

  appear: function(element, options){
    return element.setStyle('opacity: 0;').show().morph('opacity: 1', options);
  },

  fade: function(element, options){
    options = Object.extend({
      after: Element.hide.curry(element)
    }, options || {});
    return element.morph('opacity: 0', options);
  },

  cloneWithoutIDs: function(element) {
    element = $(element);
    var clone = element.cloneNode(true);
    clone.id = '';
    $(clone).select('*[id]').each(function(e) { e.id = ''; });
    return clone;
  }
});

(function(){
  var transform;

  if(window.CSSMatrix) transform = function(element, transform){
    element.style.transform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  else if(window.WebKitCSSMatrix) transform = function(element, transform){
    element.style.webkitTransform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  else if(Prototype.Browser.Gecko) transform = function(element, transform){
    element.style.MozTransform = 'scale('+(transform.scale||1)+') rotate('+(transform.rotation||0)+'rad)';
    return element;
  };
  else if(Prototype.Browser.IE) transform = function(element, transform){
    if(!element._oDims)
      element._oDims = [element.offsetWidth, element.offsetHeight];
    var c = Math.cos(transform.rotation||0) * 1, s = Math.sin(transform.rotation||0) * 1,
        filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11="+c+",M12="+(-s)+",M21="+s+",M22="+c+")";
    element.style.filter = filter;
    element.style.marginLeft = (element._oDims[0]-element.offsetWidth)/2+'px';
    element.style.marginTop = (element._oDims[1]-element.offsetHeight)/2+'px';
    return element;
  };
  else transform = function(element){ return element; }

  Element.addMethods({ transform: transform });
})();

S2.viewportOverlay = function(){
  var viewport = document.viewport.getDimensions(),
    offsets = document.viewport.getScrollOffsets();
  return new Element('div').setStyle({
    position: 'absolute',
    left: offsets.left + 'px', top: offsets.top + 'px',
    width: viewport.width + 'px', height: viewport.height + 'px'
  });
};
S2.FX.Helpers = {
  fitIntoRectangle: function(w, h, rw, rh){
    var f = w/h, rf = rw/rh; return f < rf ?
      [(rw - (w*(rh/h)))/2, 0, w*(rh/h), rh] :
      [0, (rh - (h*(rw/w)))/2, rw, h*(rw/w)];
  }
};

S2.FX.Operators.Zoom = Class.create(S2.FX.Operators.Style, {
  initialize: function($super, effect, object, options) {
    var viewport = document.viewport.getDimensions(),
      offsets = document.viewport.getScrollOffsets(),
      dims = object.getDimensions(),
      f = S2.FX.Helpers.fitIntoRectangle(dims.width, dims.height,
      viewport.width - (options.borderWidth || 0)*2,
      viewport.height - (options.borderWidth || 0)*2);

    Object.extend(options, { style: {
      left: f[0] + (options.borderWidth || 0) + offsets.left + 'px',
      top: f[1] + (options.borderWidth || 0) + offsets.top + 'px',
      width: f[2] + 'px', height: f[3] + 'px'
    }});
    $super(effect, object, options);
  }
});

S2.FX.Zoom = Class.create(S2.FX.Element, {
  setup: function() {
    this.clone = this.element.cloneWithoutIDs();
    this.element.insert({before:this.clone});
    this.clone.absolutize().setStyle({zIndex:9999});

    this.overlay = S2.viewportOverlay();
    if (this.options.overlayClassName)
      this.overlay.addClassName(this.options.overlayClassName)
    else
      this.overlay.setStyle({backgroundColor: '#000', opacity: '0.9'});
    $$('body')[0].insert(this.overlay);

    this.animate('zoom', this.clone, {
      borderWidth: this.options.borderWidth,
      propertyTransitions: this.options.propertyTransitions || { }
    });
  },
  teardown: function() {
    this.clone.observe('click', function() {
      this.overlay.remove();
      this.clone.morph('opacity:0', {
        duration: 0.2,
        after: function() {
          this.clone.remove();
        }.bind(this)
      })
    }.bind(this));
  }
});


S2.UI = {};


S2.UI.Mixin = {};


Object.deepExtend = function(destination, source) {
  for (var property in source) {
    if (source[property] && source[property].constructor &&
     source[property].constructor === Object) {
      destination[property] = destination[property] || {};
      arguments.callee(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
};

S2.UI.Mixin.Configurable = {
  setOptions: function(options) {
    if (!this.options) {
      this.options = {};
      var constructor = this.constructor;
      if (constructor.superclass) {
        var chain = [], klass = constructor;
        while (klass = klass.superclass)
          chain.push(klass);
        chain = chain.reverse();

        for (var i = 0, l = chain.length; i < l; i++)
          Object.deepExtend(this.options, chain[i].DEFAULT_OPTIONS || {});
      }

      Object.deepExtend(this.options, constructor.DEFAULT_OPTIONS || {});
    }
    return Object.deepExtend(this.options, options || {});
  }
};

S2.UI.Mixin.Trackable = {
  register: function() {
    var klass = this.constructor;
    if (!klass.instances) {
      klass.instances = [];
    }
    if (!klass.instances.include(this)) {
      klass.instances.push(this);
    }

    if (Object.isFunction(klass.onRegister)) {
      klass.onRegister.call(klass, this);
    }
  },

  unregister: function() {
    var klass = this.constructor;
    klass.instances = klass.instances.without(this);
    if (Object.isFunction(klass.onRegister)) {
      klass.onUnregister.call(klass, this);
    }
  }
};

(function() {
  var METHODS = $w('observe stopObserving show hide ' +
   'addClassName removeClassName hasClassName setStyle getStyle' +
   'writeAttribute readAttribute on fire');

  var E = {};

  METHODS.each( function(name) {
    E[name] = function() {
      var element = this.toElement();
      return element[name].apply(element, arguments);
    };
  });

  window.S2.UI.Mixin.Element = E;
})();


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

  createShim: function(element) {
    this.__shim_isie6 = (Prototype.Browser.IE &&
     (/6.0/).test(navigator.userAgent));
    if (!this.__shim_isie6) return;

    element = $(element || this.element);
    if (!element) return;

    this.__shimmed = element;

    var id = element.identify() + '_iframeshim', shim = $(id);

    if (shim) shim.remove();

    element.insert({
      top: this.__SHIM_TEMPLATE.evaluate([id])
    });

    this.__shim_id = id;
  },

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

  destroyShim: function() {
    if (!this.__shim_isie6) return;
    var shim = this.__shimmed.down('iframe#' + this.__shim_id);
    if (shim) {
      shim.remove();
    }

    this.__shimmed = null;
  }
};

Object.extend(S2.UI, {
  addClassNames: function(elements, classNames) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }

    if (Object.isString(classNames)) {
      classNames = classNames.split(' ');
    }

    var j, className;
    for (var i = 0, element; element = elements[i]; i++) {
      for (j = 0; className = classNames[j]; j++) {
        Element.addClassName(element, className);
      }
    }

    return elements;
  },

  removeClassNames: function(elements, classNames) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }

    if (Object.isString(classNames)) {
      classNames = classNames.split(' ');
    }

    var j, className;
    for (var i = 0, element; element = elements[i]; i++) {
      for (j = 0; className = classNames[j]; j++) {
        Element.removeClassName(element, className);
      }
    }
  },

  FOCUSABLE_ELEMENTS: $w('input select textarea button object'),

  isFocusable: function(element) {
    var name = element.nodeName.toLowerCase(),
     tabIndex = element.readAttribute('tabIndex'),
     isFocusable = false;

    if (S2.UI.FOCUSABLE_ELEMENTS.include(name)) {
      isFocusable = !element.disabled;
    } else if (name === 'a' || name === 'area') {
      isFocusable = element.href || (tabIndex && !isNaN(tabIndex));
    } else {
      isFocusable = tabIndex && !isNaN(tabIndex);
    }
    return !!isFocusable && S2.UI.isVisible(element);
  },


  makeFocusable: function(elements, shouldBeFocusable) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }

    var value = shouldBeFocusable ? '0' : '-1';
    for (var i = 0, element; element = elements[i]; i++) {
      $(element).writeAttribute('tabIndex', value);
    }
  },

  findFocusables: function(element) {
    return $(element).descendants().select(S2.UI.isFocusable);
  },

  isVisible: function(element) {
    element = $(element);
    var originalElement = element;

    while (element && element.parentNode) {
      var display = element.getStyle('display'),
       visibility = element.getStyle('visibility');

      if (display === 'none' || visibility === 'hidden') {
        return false;
      }
      element = $(element.parentNode);
    }
    return true;
  },

  makeVisible: function(elements, shouldBeVisible) {
    if (Object.isElement(elements)) {
      elements = [elements];
    }

    var newValue = shouldBeVisible ? "visible": "hidden";
    for (var i = 0, element; element = elements[i]; i++) {
      element.setStyle({ 'visibility': newValue });
    }

    return elements;
  },

  modifierUsed: function(event) {
    return event.metaKey || event.ctrlKey || event.altKey;
  },

  getText: function(element) {
    element = $(element);
    return element.innerText && !window.opera ? element.innerText :
     element.innerHTML.stripScripts().unescapeHTML().replace(/[\n\r\s]+/g, ' ');
  }
});

(function() {
  var IGNORED_ELEMENTS = [];
  function _textSelectionHandler(event) {
    var element = Event.element(event);
    if (!element) return;
    for (var i = 0, node; node = IGNORED_ELEMENTS[i]; i++) {
      if (element === node || element.descendantOf(node)) {
        Event.stop(event);
        break;
      }
    }
  }

  if (document.attachEvent) {
    document.onselectstart = _textSelectionHandler.bindAsEventListener(window);
  } else {
    document.observe('mousedown', _textSelectionHandler);
  }

  Object.extend(S2.UI, {
    enableTextSelection: function(element) {
      element.setStyle({
        '-moz-user-select': '',
        '-webkit-user-select': '',
        'user-select': ''
      });
      IGNORED_ELEMENTS = IGNORED_ELEMENTS.without(element);
      return element;
    },

    disableTextSelection: function(element) {
      element.setStyle({
        '-moz-user-select': 'none',
        '-webkit-user-select': 'none',
        'user-select': ''
      });
      if (!IGNORED_ELEMENTS.include(element)) {
        IGNORED_ELEMENTS.push(element);
      }
      return element;
    }
  });
})();
S2.UI.Behavior = Class.create(S2.UI.Mixin.Configurable, {
  initialize: function(element, options) {
    this.element = element;
    this.setOptions(options);

    Object.extend(this, options);

    this._observers = {};

    function isEventHandler(eventName) {
      return eventName.startsWith('on') || eventName.include('/on');
    }

    var parts, element, name, handler;
    for (var eventName in this) {
      if (!isEventHandler(eventName)) continue;

      parts = eventName.split('/');
      if (parts.length === 2) {
        element = this[parts.first()] || this.element;
      } else {
        element = this.element;
      }
      name = parts.last();

      handler = this._observers[name] = this[eventName].bind(this);
      element.observe(name.substring(2), handler);
    }
  },

  destroy: function() {
    var element = this.options.proxy || this.element;
    var handler;
    for (var eventName in this._observers) {
      handler = this._observers[eventName];
      element.stopObserving(eventName.substring(2), handler);
    }
  }
});


Object.extend(S2.UI, {
  addBehavior: function(element, behaviorClass, options) {
    var self = arguments.callee;
    if (Object.isArray(element)) {
      element.each( function(el) { self(el, behaviorClass, options); });
      return;
    }

    if (Object.isArray(behaviorClass)) {
      behaviorClass.each( function(klass) { self(element, klass, options ); });
      return;
    }

    var instance = new behaviorClass(element, options || {});
    var behaviors = $(element).retrieve('ui.behaviors', []);
    behaviors.push(instance);
  },

  removeBehavior: function(element, behaviorClass) {
    var self = arguments.callee;
    if (Object.isArray(element)) {
      element.each( function(el) { self(el, behaviorClass); });
      return;
    }

    if (Object.isArray(behaviorClass)) {
      behaviorClass.each( function(klass) { self(element, klass); });
      return;
    }

    var behaviors = $(element).retrieve('ui.behaviors', []);
    var shouldBeRemoved = [];
    for (var i = 0, behavior; behavior = behaviors[i]; i++) {
      if (!behavior instanceof behaviorClass) continue;
      behavior.destroy();
      shouldBeRemoved.push(behavior);
    }
    $(element).store('ui.behaviors', behaviors.without(shouldBeRemoved));
  },


  getBehavior: function(element, behaviorClass) {
    element = $(element);

    var behaviors = element.retrieve('ui.behaviors', []);
    for (var i = 0, l = behaviors.length, b; i < l; i++) {
      b = behaviors[i];
      if (b.constructor === behaviorClass) return b;
    }

    return null;
  }
});

S2.UI.Behavior.Drag = Class.create(S2.UI.Behavior, {
  initialize: function($super, element, options) {
    this.__onmousemove = this._onmousemove.bind(this);
    $super(element, options);
    this.element.addClassName('ui-draggable');
  },

  destroy: function($super) {
    this.element.removeClassName('ui-draggable');
    $super();
  },

  "handle/onmousedown": function(event) {
    var element = this.element;
    this._startPointer  = event.pointer();
    this._startPosition = {
      left: window.parseInt(element.getStyle('left'), 10),
      top:  window.parseInt(element.getStyle('top'),  10)
    };
    document.observe('mousemove', this.__onmousemove);
  },

  "handle/onmouseup": function(event) {
    this._startPointer  = null;
    this._startPosition = null;
    document.stopObserving('mousemove', this.__onmousemove);
  },

  _onmousemove: function(event) {
    var pointer = event.pointer();

    if (!this._startPointer) return;

    var delta = {
      x: pointer.x - this._startPointer.x,
      y: pointer.y - this._startPointer.y
    };

    var newPosition = {
      left: (this._startPosition.left + delta.x) + 'px',
      top:  (this._startPosition.top  + delta.y) + 'px'
    };

    this.element.setStyle(newPosition);
  }
});
S2.UI.Behavior.Focus = Class.create(S2.UI.Behavior, {
  onfocus: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.addClassName('ui-state-focus');
  },

  onblur: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.removeClassName('ui-state-focus');
  }
});
S2.UI.Behavior.Hover = Class.create(S2.UI.Behavior, {
  onmouseenter: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.addClassName('ui-state-hover');
  },

  onmouseleave: function(event) {
    if (this.element.hasClassName('ui-state-disabled')) return;
    this.element.removeClassName('ui-state-hover');
  }
});
S2.UI.Behavior.Resize = Class.create(S2.UI.Behavior, {
  initialize: function(element, options) {
  }
});
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

  onmouseleave: function(event) {
    return this.onmouseup(event);
  },

  onmouseenter: function(event) {
    if (this._down) {
      return this.onmousedown(event);
    }
  }
});



(function(UI) {

  UI.Base = Class.create(UI.Mixin.Configurable, {
    NAME: "S2.UI.Base",

    addObservers:    Function.ABSTRACT,

    removeObservers: Function.ABSTRACT,

    destroy: function() {
      this.removeObservers();
    },

    toElement: function() {
      return this.element;
    },

    inspect: function() {
      return "#<#{NAME}>".interpolate(this);
    }
  });

})(S2.UI);

Object.extend(Event, {
  KEY_SPACE: 32
});

(function(UI) {

  UI.Accordion = Class.create(UI.Base, {
    NAME: "S2.UI.Accordion",

    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-accordion ui-widget ui-helper-reset');

      if (this.element.nodeName.toUpperCase() === "UL") {
        var lis = this.element.childElements().grep(new Selector('li'));
        UI.addClassNames(lis, 'ui-accordion-li-fix');
      }

      this.headers = this.element.select(opt.headerSelector);
      if (!this.headers || this.headers.length === 0) return;

      UI.addClassNames(this.headers, 'ui-accordion-header ui-helper-reset ' +
       'ui-state-default ui-corner-all');
      UI.addBehavior(this.headers, [UI.Behavior.Hover, UI.Behavior.Focus]);

      this.content = this.headers.map( function(h) { return h.next(); });

      UI.addClassNames(this.content, 'ui-accordion-content ui-helper-reset ' +
       'ui-widget-content ui-corner-bottom');

      this.headers.each( function(header) {
        var icon = new Element('span');
        UI.addClassNames(icon, 'ui-icon ' + opt.icons.header);
        header.insert({ top: icon });
      });

      this._markActive(opt.active || this.headers.first(), false);

      this.element.writeAttribute({
        'role': 'tablist',
        'aria-multiselectable': opt.multiple.toString()
      });
      this.headers.invoke('writeAttribute', 'role', 'tab');
      this.content.invoke('writeAttribute', 'role', 'tabpanel');

      var links = this.headers.map( function(h) { return h.down('a'); });
      links.invoke('observe', 'click', function(event) {
        event.preventDefault();
      });

      this.observers = {
        click: this.click.bind(this),
        keypress: this.keypress.bind(this)
      };

      this.addObservers();
    },

    addObservers: function() {
      this.headers.invoke('observe', 'click', this.observers.click);
      if (Prototype.Browser.WebKit) {
        this.headers.invoke('observe', 'keydown', this.observers.keypress);
      } else {
        this.headers.invoke('observe', 'keypress', this.observers.keypress);
      }
    },

    click: function(event) {
      var header = event.findElement(this.options.headerSelector);
      if (!header || !this.headers.include(header)) return;
      this._toggleActive(header);
    },

    keypress: function(event) {
      if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }
      var header = event.findElement(this.options.headerSelector);
      var keyCode = (event.keyCode === 0) ? event.charCode : event.keyCode;
      switch (keyCode) {
      case Event.KEY_SPACE:
        this._toggleActive(header);
        event.stop();
        return;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_RIGHT:
        this._focusHeader(header, 1);
        event.stop();
        return;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_LEFT:
        this._focusHeader(header, -1);
        event.stop();
        return;
      case Event.KEY_HOME:
        this._focusHeader(this.headers.first());
        event.stop();
        return;
      case Event.KEY_END:
        this._focusHeader(this.headers.last());
        event.stop();
        return;
      }
    },

    _focusHeader: function(header, delta) {
      if (Object.isNumber(delta)) {
        var index = this.headers.indexOf(header);
        index = index + delta;
        if (index > (this.headers.length - 1)) {
          index = this.headers.length - 1;
        } else if (index < 0) {
          index = 0;
        }
        header = this.headers[index];
      }
      (function() { header.down('a').focus(); }).defer();
    },

    _toggleActive: function(header) {
      if (header.hasClassName('ui-state-active')) {
        if (!this.options.multiple) return;
        this._removeActive(header);
        this._activatePanel(null, header.next(), true);
      } else {
        this._markActive(header);
      }
    },

    _removeActive: function(active) {
      var opt = this.options;
      UI.removeClassNames(active, 'ui-state-active ui-corner-top');
      UI.addClassNames(active, 'ui-state-default ui-corner-all');
      active.writeAttribute('aria-expanded', 'false');

      var icon = active.down('.ui-icon');
      icon.removeClassName(opt.icons.headerSelected);
      icon.addClassName(opt.icons.header);
    },

    _markActive: function(active, shouldAnimate) {
      if (Object.isUndefined(shouldAnimate)) {
        shouldAnimate = true;
      }
      var opt = this.options;

      var activePanel = null;
      if (!opt.multiple) {
        activePanel = this.element.down('.ui-accordion-content-active');
        this.headers.each(this._removeActive.bind(this));
      }

      if (!active) return;

      UI.removeClassNames(active, 'ui-state-default ui-corner-all');
      UI.addClassNames(active, 'ui-state-active ui-corner-top');

      active.writeAttribute('aria-expanded', 'true');

      this._activatePanel(active.next(), activePanel, shouldAnimate);

      var icon = active.down('.ui-icon');
      icon.removeClassName(opt.icons.header);
      icon.addClassName(opt.icons.headerSelected);

      return active;
    },

    _activatePanel: function(panel, previousPanel, shouldAnimate) {
      if (shouldAnimate) {
        this.options.transition(panel, previousPanel);
      } else {
        if (previousPanel) {
          previousPanel.removeClassName('ui-accordion-content-active');
        }
        if (panel) {
          panel.addClassName('ui-accordion-content-active');
        }
      }
    }
  });

  Object.extend(UI.Accordion, {
    DEFAULT_OPTIONS: {
      multiple: false,  /* whether more than one pane can be open at once */
      headerSelector: 'h3',

      icons: {
        header:         'ui-icon-triangle-1-e',
        headerSelected: 'ui-icon-triangle-1-s'
      },

      transition: function(panel, previousPanel) {
        var effects = [], effect;

        if (previousPanel) {
          effect = new S2.FX.SlideUp(previousPanel, {
            duration: 0.2,
            after: function() {
              previousPanel.removeClassName('ui-accordion-content-active');
            }
          });
          effects.push(effect);
        }

        if (panel) {
          effect = new S2.FX.SlideDown(panel, {
            duration: 0.2,
            before: function() {
              panel.addClassName('ui-accordion-content-active');
            }
          });
          effects.push(effect);
        }

        effects.invoke('play');
      }
    }
  });

})(S2.UI);


(function(UI) {
  UI.Button = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Button",

    initialize: function(element, options) {
      this.element = $(element);

      var name = this.element.nodeName.toUpperCase(), type;

      if (name === 'INPUT') {
        type = this.element.type;
        if (type === 'checkbox' || type === 'radio') {
          this.type = this.element.type;
        } else {
          this.type = 'input';
        }
      } else {
        this.type = 'button';
      }

      var opt = this.setOptions(options);

      if (this._isCheckboxOrRadio()) {
        this._handleFormWidget();
      } else {
        this._makeButtonElement(this.element);
      }

      this.element.store('ui.button', this);
      if (this._buttonElement !== this.element) {
        this._buttonElement.store('ui.button', this);
      }

      this.enabled = true;

      var disabled = (this.element.disabled === true)
       this.element.hasClassName('ui-state-disabled');

      this.setEnabled(!disabled);

      this.observers = {
        click: this._click.bind(this),
        keyup: this._keyup.bind(this)
      };
      this.addObservers();
    },

    addObservers: function() {
      this.observe('click', this.observers.click);
      this.observe('keyup', this.observers.keyup);
    },

    removeObservers: function() {
      this.stopObserving('click', this.observers.click);
      this.stopObserving('keydown', this.observers.keydown);
    },

    isActive: function() {
      if (!this._isToggleButton()) return false;
      return this.hasClassName('ui-state-active');
    },

    _setActive: function(bool) {
      this[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
    },

    toggle: function(bool) {
      if (!this._isToggleButton()) return;

      var isActive = this.isActive();
      if (Object.isUndefined(bool)) bool = !isActive;

      var willChange = (bool !== isActive);
      if (willChange) {
        var result = this.toElement().fire('ui:button:toggle');
        if (result.stopped) return;
      }
      this._buttonElement[bool ? 'addClassName' : 'removeClassName']('ui-state-active');
    },

    _click: function(event) {
      this.toggle(!this.isActive());
      this.element.checked = this.isActive();
    },

    _keyup: function(event) {
      var code = event.keyCode;
      if (code !== Event.KEY_SPACE && code !== Event.KEY_RETURN)
        return;

      var isActive = this.isActive();

      (function() {
        if (isActive !== this.isActive()) return;
        this.toggle(isActive);
        this.element.checked = isActive;
      }).bind(this).defer();
    },

    _isCheckboxOrRadio: function() {
      return this.type === 'checkbox' || this.type === 'radio';
    },

    _isToggleButton: function() {
      return this._isCheckboxOrRadio() || this.options.toggle;
    },

    _makeButtonElement: function(element) {
      this._buttonElement = element;

      var opt = this.options;
      UI.addClassNames(element,
       'ui-button ui-widget ui-state-default ui-corner-all');

      var B = UI.Behavior, behaviors = [B.Hover, B.Focus, B.Down];
      UI.addBehavior(element, behaviors);

      if (opt.primary) {
        element.addClassName('ui-priority-primary');
      }

      if (opt.text === null) {
        opt.text = element.innerHTML || element.value;
      }

      this._interpretContent(element);

      element.writeAttribute('role', 'button');
    },

    _makeIconElement: function(name, type) {
      var classNames = 'ui-button-icon-' + type + ' ui-icon ' + name;
      return new Element('span', { 'class': classNames });
    },

    _interpretContent: function(element) {
      if (!this._isContainer()) return;

      var opt = this.options;
      var buttonClassName, primaryIcon, secondaryIcon;
      var hasIcon     = !!opt.icons.primary || !!opt.icons.secondary;
      var hasTwoIcons = !!opt.icons.primary && !!opt.icons.secondary;

      if (opt.icons.primary) {
        primaryIcon = this._makeIconElement(opt.icons.primary, 'primary');
      }

      if (opt.icons.secondary) {
        secondaryIcon = this._makeIconElement(opt.icons.secondary, 'secondary');
      }

      if (hasIcon) {
        if (this._hasText()) {
          buttonClassName = hasTwoIcons ? 'ui-button-text-icons' :
           'ui-button-text-icon';
        } else {
          buttonClassName = hasTwoIcons ? 'ui-button-icons-only' :
           'ui-button-icon-only';
        }
      } else {
        buttonClassName = 'ui-button-text-only';
      }

      this._wrapContentsInTextSpan(element);
      element.addClassName(buttonClassName);

      if (primaryIcon) {
        element.insert({ top: primaryIcon });
      }

      if (secondaryIcon) {
        element.insert({ bottom: secondaryIcon });
      }
    },

    _wrapContentsInTextSpan: function(element) {
      var text = new Element('span', { 'class': 'ui-button-text' });
      for (var i = 0, node; node = element.childNodes[i]; i++) {
        text.appendChild(node);
      }
      element.appendChild(text);
    },

    _hasText: function() {
      return !!this.options.text;
    },

    _isContainer: function() {
      var element = this.toElement(), tag = element.nodeName.toUpperCase();
      return (tag !== 'INPUT');
    },

    _handleFormWidget: function() {
      var opt = this.options;
      var id = this.element.id, label;
      if (id) {
        label = $$('label[for="' + id + '"]')[0];
      }
      if (!label) {
        label = this.element.up('label');
      }

      if (!label) {
        opt.text = null;
        return;
      }


      this.element.addClassName('ui-helper-hidden-accessible');
      this._makeButtonElement(label);
      UI.makeFocusable(label, true);
      this.label = label;
    },

    setEnabled: function(isEnabled) {
      var element = this._buttonElement;
      if (this.enabled === isEnabled) return;
      this.enabled = isEnabled;
      if (isEnabled) {
        element.removeClassName('ui-state-disabled');
      } else {
        element.addClassName('ui-state-disabled');
      }
      this.element.disabled = !isEnabled;
    },

    toElement: function() {
      return this._buttonElement;
    },

    inspect: function() {
      return this.toElement().inspect();
    }
  });

  Object.extend(UI.Button, {
    DEFAULT_OPTIONS: {
      primary: false,
      text:    true,
      toggle:  false,
      icons: {
        primary: null,
        secondary: null
      }
    }
  });

})(S2.UI);
(function(UI) {

  UI.ButtonSet = Class.create(UI.Base, {
    NAME: "S2.UI.ButtonSet",

    initialize: function(element, options) {
      this.element = $(element);
      this.element.store('ui.buttonset', this);
      var opt = this.setOptions(options);

      this.element.addClassName('ui-buttonset');
      this.refresh();

      this.observers = {
        toggle: this._toggle.bind(this)
      };
      this.addObservers();
    },

    addObservers: function() {
      this.element.observe('ui:button:toggle', this.observers.toggle);
    },

    removeObservers: function() {
      this.element.stopObserving('ui:button:toggle', this.observers.toggle);
    },

    destroy: function() {
      this.removeObservers();
      this.element.removeClassName('ui-buttonset');
      UI.removeClassNames(this.buttons, 'ui-corner-left ui-corner-right');

      this.element.getStorage().unset('ui.buttonset');
    },

    _destroyButton: function(el) {
      var instance = el.retrieve('ui.button');
      if (instance) instance.destroy();
    },

    _toggle: function(event) {
      var element = event.element(), instance = element.retrieve('ui.button');
      if (!instance || instance.type !== 'radio') return;

      if (instance.isActive()) {
        event.stop();
        return;
      }

      this.instances.each( function(b) {
        b._setActive(false);
      });
    },

    refresh: function() {
      this.element.cleanWhitespace();

      this.buttons = [];

      this.element.descendants().each( function(el) {
        var isButton = false;
        if ($w('SELECT BUTTON A').include(el.nodeName.toUpperCase()))
          isButton = true;
        if (el.match('input') && el.type !== 'hidden') isButton = true;
        if (el.hasClassName('ui-button')) isButton = true;

        if (isButton) this.buttons.push(el);
      }, this);

      this.instances = this.buttons.map( function(el) {
        var instance = el.retrieve('ui.button');
        if (!instance) instance = new UI.Button(el);
        return instance;
      });

      this.instances.each( function(b) {
        UI.removeClassNames(b.toElement(),
         'ui-corner-all ui-corner-left ui-corner-right');
      });

      if (this.instances.length > 0) {
        this.instances.first().toElement().addClassName('ui-corner-left');
        this.instances.last().toElement().addClassName('ui-corner-right');
      }
    }
  });

})(S2.UI);
(function(UI) {

  UI.ButtonWithMenu = Class.create(UI.Button, {
    initialize: function($super, element, options) {
      var opt = this.setOptions(options);
      $super(element, options);

      this.menu = new UI.Menu();
      this.element.insert({ after: this.menu });

      if (opt.choices) {
        opt.choices.each(this.menu.addChoice, this.menu);
      }

      (function() {
        var iLayout = this.element.getLayout();

        this.menu.setStyle({
          left: iLayout.get('left') + 'px',
          top:  (iLayout.get('top') + iLayout.get('margin-box-height')) + 'px'
        });
      }).bind(this).defer();

      Object.extend(this.observers, {
        clickForMenu:  this._clickForMenu.bind(this),
        onMenuOpen:    this._onMenuOpen.bind(this),
        onMenuClose:   this._onMenuClose.bind(this),
        onMenuSelect:  this._onMenuSelect.bind(this)
      });

      this.observe('mousedown', this.observers.clickForMenu);

      this.menu.observe('ui:menu:after:open',  this.observers.onMenuOpen );
      this.menu.observe('ui:menu:after:close', this.observers.onMenuClose);
      this.menu.observe('ui:menu:selected',    this.observers.onMenuSelect);
    },

    _clickForMenu: function(event) {
      if (this.menu.isOpen()) {
        this.menu.close();
      } else {
        this.menu.open();
      }
    },

    _onMenuOpen: function() {
      var menuElement = this.menu.element, buttonElement = this.toElement();
      if (!this._clickOutsideMenuObserver) {
        this._clickOutsideMenuObserver = $(document.body).on('click', function(event) {
          var el = event.element();
          if (el !== menuElement && !el.descendantOf(menuElement) &&
           el !== buttonElement && !el.descendantOf(buttonElement)) {
            this.menu.close();
          }
        }.bind(this));
      } else {
        this._clickOutsideMenuObserver.start();
      }
    },

    _onMenuClose: function() {
      if (this._clickOutsideMenuObserver)
        this._clickOutsideMenuObserver.stop();
    },

    _onMenuSelect: function(event) {
      var element = event.element();
      this.fire('ui:button:menu:selected', {
        instance: this,
        element:  event.memo.element
      });
    }
  });


  Object.extend(UI.ButtonWithMenu, {
    DEFAULT_OPTIONS: {
      icons: { primary: 'ui-icon-bullet', secondary: 'ui-icon-triangle-1-s' }
    }
  });

})(S2.UI);

(function(UI) {
  UI.Tabs = Class.create(UI.Base, {
    NAME: "S2.UI.Tabs",

    initialize: function(element, options) {
      this.element = $(element);
      UI.addClassNames(this.element,
       'ui-widget ui-widget-content ui-tabs ui-corner-all');

      this.setOptions(options);
      var opt = this.options;

      this.anchors = [];
      this.panels  = [];

      this.list = this.element.down('ul');
      this.list.cleanWhitespace();
      this.nav  = this.list;
      UI.addClassNames(this.nav,
       'ui-tabs-nav ui-helper-reset ui-helper-clearfix ' +
       'ui-widget-header ui-corner-all');

      this.tabs = this.list.select('li');
      UI.addClassNames(this.tabs, 'ui-state-default ui-corner-top');
      UI.addBehavior(this.tabs, [UI.Behavior.Hover, UI.Behavior.Down]);

      this.element.writeAttribute({
        'role': 'tablist',
        'aria-multiselectable': 'false'
      });

      this.tabs.each( function(li) {
        var anchor = li.down('a');
        if (!anchor) return;

        var href = anchor.readAttribute('href');
        if (!href.include('#')) return;

        var hash = href.split('#').last(), panel = $(hash);

        li.writeAttribute('tabIndex', '0');

        if (panel) {
          panel.store('ui.tab', li);
          li.store('ui.panel', panel);

          this.anchors.push(anchor);
          this.panels.push(panel);
        }
      }, this);

      this.anchors.invoke('writeAttribute', 'role', 'tab');
      this.panels.invoke('writeAttribute', 'role', 'tabpanel');

      this.tabs.first().addClassName('ui-position-first');
      this.tabs.last().addClassName('ui-position-last');

      UI.addClassNames(this.panels,
       'ui-tabs-panel ui-tabs-hide ui-widget-content ui-corner-bottom');

      this.observers = {
        onKeyPress: this.onKeyPress.bind(this),
        onTabClick: this.onTabClick.bind(this)
      };
      this.addObservers();

      var selectedTab;

      var urlHash = window.location.hash.substring(1), activePanel;
      if (!urlHash.empty()) {
        activePanel = $(urlHash);
      }
      if (activePanel && this.panels.include(activePanel)) {
        selectedTab = activePanel.retrieve('ui.tab');
      } else {
        selectedTab = opt.selectedTab ? $(opt.selectedTab) :
         this.tabs.first();
      }

      this.setSelectedTab(selectedTab);
    },

    addObservers: function() {
      this.anchors.invoke('observe', 'click', this.observers.onTabClick);
      this.tabs.invoke('observe', 'keypress', this.observers.onKeyPress);
    },

    _setSelected: function(id) {
      var panel = $(id), tab = panel.retrieve('ui.tab');

      var oldTab = this.list.down('.ui-tabs-selected');
      var oldPanel = oldTab ? oldTab.retrieve('ui.panel') : null;

      UI.removeClassNames(this.tabs, 'ui-tabs-selected ui-state-active');
      UI.addClassNames(this.tabs, 'ui-state-default');

      tab.removeClassName('ui-state-default').addClassName(
       'ui-tabs-selected ui-state-active');

      this.element.fire('ui:tabs:change', {
        from: { tab: oldTab, panel: oldPanel },
        to:   { tab: tab,    panel: panel    }
      });
      this.options.panel.transition(oldPanel, panel);
    },

    setSelectedTab: function(tab) {
      this.setSelectedPanel(tab.retrieve('ui.panel'));
    },

    setSelectedPanel: function(panel) {
      this._setSelected(panel.readAttribute('id'));
    },

    onTabClick: function(event) {
      event.stop();
      var anchor = event.findElement('a'), tab = event.findElement('li');

      this.setSelectedTab(tab);
    },

    onKeyPress: function(event) {
      if (UI.modifierUsed(event)) return;
      var tab = event.findElement('li');
      var keyCode = event.keyCode || event.charCode;

      switch (keyCode) {
      case Event.KEY_SPACE:  // fallthrough
      case Event.KEY_RETURN:
        this.setSelectedTab(tab);
        event.stop();
        return;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_LEFT:
        this._focusTab(tab, -1);
        return;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_RIGHT:
        this._focusTab(tab, 1);
        return;
      }
    },

    _focusTab: function(tab, delta) {
      if (Object.isNumber(delta)) {
        var index = this.tabs.indexOf(tab);
        index = index + delta;
        if (index > (this.tabs.length - 1)) {
          index = this.tabs.length - 1;
        } else if (index < 0) {
          index = 0;
        }
        tab = this.tabs[index];
      }
      (function() { tab.focus(); }).defer();
    }
  });

  Object.extend(UI.Tabs, {
    DEFAULT_OPTIONS: {
      panel: {
        transition: function(from, to) {
          if (from) {
            from.addClassName('ui-tabs-hide');
          }
          to.removeClassName('ui-tabs-hide');
        }
      }
    }
  });
})(S2.UI);
(function(UI) {


  UI.Overlay = Class.create(
   UI.Base,
   UI.Mixin.Trackable,
   UI.Mixin.Shim, {
    NAME: "S2.UI.Overlay",

    initialize: function(options) {
      this.setOptions(options);
      this.element = new Element('div', {
        'class': 'ui-widget-overlay'
      });

      this.register();
      this.createShim();
      this.adjustShim();
      this.constructor.onResize();
    },

    destroy: function() {
      this.element.remove();
      this.unregister();
    },

    toElement: function() {
      return this.element;
    }
  });

  Object.extend(UI.Overlay, {
    onRegister: function() {
      if (this.instances.length !== 1) return;

      this._resizeObserver = this._resizeObserver || this.onResize.bind(this);
      Event.observe(window, 'resize', this._resizeObserver);
      Event.observe(window, 'scroll', this._resizeObserver);
    },

    onUnregister: function() {
      if (this.instances.length !== 0) return;
      Event.stopObserving(window, 'resize', this._resizeObserver);
      Event.stopObserving(window, 'scroll', this._resizeObserver);
    },

    onResize: function() {
      var vSize   = document.viewport.getDimensions();
      var offsets = document.viewport.getScrollOffsets();
      this.instances.each( function(instance) {
        var element = instance.element;
        element.setStyle({
          width:  vSize.width  + 'px',
          height: vSize.height + 'px',
          left:   offsets.left + 'px',
          top:    offsets.top  + 'px'
        });
      });
      (function() {
        this.instances.invoke('adjustShim');
      }).bind(this).defer();
    }
  });

})(S2.UI);
(function(UI) {

  UI.Dialog = Class.create(UI.Base, UI.Mixin.Element, {
    NAME: "S2.UI.Dialog",

    initialize: function(element, options) {
      if (!Object.isElement(element)) {
        options = element;
        element = null;
      } else {
        element = $(element);
      }

      var opt = this.setOptions(options);

      this.element = element || new Element('div');
      UI.addClassNames(this.element, 'ui-dialog ui-widget ' +
       'ui-widget-content ui-corner-all');

      this.element.hide().setStyle({
        position: 'absolute',
        overflow: 'hidden',
        zIndex:   opt.zIndex,
        outline:  '0'
      });

      this.element.writeAttribute({
        tabIndex: '-1',
        role: 'dialog'
      });

      if (opt.content) {
        this.content = Object.isElement(opt.content) ? opt.content :
         new Element('div').update(opt.content);
      } else {
        this.content = new Element('div');
      }

      UI.addClassNames(this.content, 'ui-dialog-content ui-widget-content');
      this.element.insert(this.content);

      this.titleBar = this.options.titleBar || new Element('div');
      UI.addClassNames(this.titleBar, 'ui-dialog-titlebar ui-widget-header ' +
  		 'ui-corner-all ui-helper-clearfix');
  		this.element.insert({ top: this.titleBar });

  	  this.closeButton = new Element('a', { 'href': '#' });
  	  UI.addClassNames(this.closeButton, 'ui-dialog-titlebar-close ' +
  	   'ui-corner-all');
  	  new UI.Button(this.closeButton, {
  	    text: false,
  	    icons: { primary: 'ui-icon-closethick' }
  	  });
  	  this.closeButton.observe('mousedown', Event.stop);
  	  this.closeButton.observe('click', function(event) {
  	    event.stop();
  	    this.close(false);
  	  }.bind(this));

  	  this.titleBar.insert(this.closeButton);


  	  this.titleText = new Element('span', { 'class': 'ui-dialog-title' });
  	  this.titleText.update(this.options.title).identify();
  	  this.element.writeAttribute('aria-labelledby',
  	   this.titleText.readAttribute('id'));
  	  this.titleBar.insert({ top: this.titleText }) ;

      UI.disableTextSelection(this.element);

      if (this.options.draggable) {
        UI.addBehavior(this.element, UI.Behavior.Drag,
         { handle: this.titleBar });
      }


      var buttons = this.options.buttons;

      if (buttons && buttons.length) {
        this._createButtons();
      }

      this.observers = {
        keypress: this.keypress.bind(this)
      };

    },

    toElement: function() {
      return this.element;
    },

    _createButtons: function() {
      var buttons = this.options.buttons;
      if (this.buttonPane) {
        this.buttonPane.remove();
      }

      this.buttonPane = new Element('div');
      UI.addClassNames(this.buttonPane,
       'ui-dialog-buttonpane ui-widget-content ui-helper-clearfix');

      buttons.each( function(button) {
        var element = new Element('button', { type: 'button' });
        UI.addClassNames(element, 'ui-state-default ui-corner-all');

        if (button.primary) {
          element.addClassName('ui-priority-primary');
        }

        if (button.secondary) {
          element.addClassName('ui-priority-secondary');
        }

        element.update(button.label);
        new UI.Button(element);
        element.observe('click', button.action.bind(this, this));

        this.buttonPane.insert(element);
      }, this);

      this.element.insert(this.buttonPane);
    },

    _position: function() {
      var vSize = document.viewport.getDimensions();
      var dialog = this.element;
      var dimensions = {
        width: parseInt(dialog.getStyle('width'), 10),
        height: parseInt(dialog.getStyle('height'), 10)
      };
      var position = {
        left: ((vSize.width / 2) - (dimensions.width / 2)).round(),
        top: ((vSize.height / 2) - (dimensions.height / 2)).round()
      };

      var offsets = document.viewport.getScrollOffsets();

      position.left += offsets.left;
      position.top  += offsets.top;

      this.element.setStyle({
        left: position.left + 'px',
        top:  position.top  + 'px'
      });
    },

    open: function() {
      if (this._isOpen) return;

      var result = this.element.fire("ui:dialog:before:open",
       { dialog: this });
      if (result.stopped) return;

      var opt = this.options;

      this.overlay = opt.modal ? new UI.Overlay() : null;
      $(document.body).insert(this.overlay);
      $(document.body).insert(this.element);

      this.element.show();
      this._position();

      this.focusables = UI.findFocusables(this.element);

      var forms = this.content.select('form');
      if (this.content.match('form')) {
        forms.push(this.content);
      }

      if (!opt.submitForms) {
        forms.invoke('observe', 'submit', Event.stop);
      }

      var f = this.focusables.without(this.closeButton);
      var focus = opt.focus, foundFocusable = false;
      if (focus === 'auto' && forms.length > 0) {
        Form.focusFirstElement(forms.first());
        foundFocusable = true;
      } else if (focus === 'first') {
        f.first().focus();
        foundFocusable = true;
      } else if (focus === 'last') {
        f.last().focus();
        foundFocusable = true;
      } else if (Object.isElement(focus)) {
        focus.focus();
        foundFocusable = true;
      } else {
        if (this.buttonPane) {
          var primary = this.buttonPane.down('.ui-priority-primary');
          if (primary) {
            primary.focus();
            foundFocusable = true;
          }
        }
      }

      if (!foundFocusable && f.length > 0) {
        f.first().focus();
      }

      Event.observe(window, 'keydown', this.observers.keypress);
      this._isOpen = true;

      this.element.fire("ui:dialog:after:open", { dialog: this });
      return this;
    },

    close: function(success) {
      success = !!success; // Coerce to a boolean.
      var result = this.element.fire("ui:dialog:before:close",
       { dialog: this });
      if (result.stopped) return;

      if (this.overlay) {
        this.overlay.destroy();
      }

      this.element.hide();
      this._isOpen = false;
      Event.stopObserving(window, 'keydown', this.observers.keypress);

      var memo = { dialog: this, success: success };

      var form = this.content.match('form') ? this.content : this.content.down('form');
      if (form) {
        Object.extend(memo, { form: form.serialize({ hash: true }) });
      }

      this.element.fire("ui:dialog:after:close", memo);
      UI.enableTextSelection(this.element, true);
      return this;
    },

    keypress: function(event) {
      if (UI.modifierUsed(event)) return;

      var f = this.focusables, opt = this.options;
      if (event.keyCode === Event.KEY_ESC) {
        if (opt.closeOnEscape) this.close(false);
        return;
      }

      if (event.keyCode === Event.KEY_RETURN) {
        this.close(true);
        return;
      }

      if (event.keyCode === Event.KEY_TAB) {
        if (!this.options.modal) return;
        if (!f) return;
        var next, current = event.findElement();
        var index = f.indexOf(current);
        if (index === -1) {
          next = f.first();
        } else {
          if (event.shiftKey) {
            next = index === 0 ? f.last() : f[index - 1];
          } else {
            next = (index === (f.length - 1)) ? f.first() : f[index + 1];
          }
        }

        if (next) {
          event.stop();
          (function() { next.focus(); }).defer();
        }
      }
    }
  });

  Object.extend(UI.Dialog, {
    DEFAULT_OPTIONS: {
      zIndex: 1000,

      title: "Dialog",

      content: null,
      modal:   true,
      focus:   'auto',

      submitForms: false,

      closeOnEscape: true,

      draggable: true,
      resizable: false,

      buttons: [
        {
          label: "OK",
          primary: true,
          action: function(instance) {
            instance.close(true);
          }
        }
      ]
    }
  });

})(S2.UI);


(function(UI) {
  UI.Slider = Class.create(UI.Base, {
    NAME: "S2.UI.Slider",

    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-slider ui-widget ' +
       'ui-widget-content ui-corner-all');

      this.orientation = opt.orientation;

      this.element.addClassName('ui-slider-' + this.orientation);

      this._computeTrackLength();

      var initialValues = opt.value.initial;
      if (!Object.isArray(initialValues)) {
        initialValues = [initialValues];
      }

      this.values  = initialValues;
      this.handles = [];
      this.values.each( function(value, index) {
        var handle = new Element('a', { href: '#' });
        handle.store('ui.slider.handle', index);
        this.handles.push(handle);
        this.element.insert(handle);
      }, this);

      UI.addClassNames(this.handles, 'ui-slider-handle ui-state-default ' +
       'ui-corner-all');
      this.handles.invoke('writeAttribute', 'tabIndex', '0');

      this.activeHandle = this.handles.first();

      this.handles.invoke('observe', 'click', Event.stop);
      UI.addBehavior(this.handles, [UI.Behavior.Hover, UI.Behavior.Focus]);

      this.observers = {
        focus:          this.focus.bind(this),
        blur:           this.blur.bind(this),
        keydown:        this.keydown.bind(this),
        keyup:          this.keyup.bind(this),
        mousedown:      this.mousedown.bind(this),
        mouseup:        this.mouseup.bind(this),
        mousemove:      this.mousemove.bind(this),
        rangeMouseDown: this.rangeMouseDown.bind(this),
        rangeMouseMove: this.rangeMouseMove.bind(this),
        rangeMouseUp:   this.rangeMouseUp.bind(this)
      };

      var v = opt.value;
      if (v.step !== null) {
        this._possibleValues = [];
        for (var val = v.min; val < v.max; val += v.step) {
          this._possibleValues.push(val);
        }
        this._possibleValues.push(v.max);

        this.keyboardStep = v.step;
      } else if (opt.possibleValues) {
        this._possibleValues = opt.possibleValues.clone();
        this.keyboardStep = null;
      } else {
        this.keyboardStep = (v.max - v.min) / 100;
      }

      this.range = null;
      if (opt.range && this.values.length === 2) {
        this.restricted = true;
        this.range = new Element('div', { 'class': 'ui-slider-range' });
        this.element.insert(this.range);

        this.range.addClassName('ui-widget-header');
      }

      this._computeTrackLength();
      this._computeHandleLength();

      this.active   = false;
      this.dragging = false;
      this.disabled = false;

      this.addObservers();

      this.values.each(this.setValue, this);

      this.initialized = true;
    },

    addObservers: function() {
      this.element.observe('mousedown', this.observers.mousedown);
      if (this.range) {
        this.range.observe('mousedown', this.observers.rangeMouseDown);
      }
      this.handles.invoke('observe', 'keydown', this.observers.keydown);
      this.handles.invoke('observe', 'keyup',   this.observers.keyup);
    },

    _computeTrackLength: function() {
      var length, dim;
      if (this.orientation === 'vertical') {
        dim = this.element.offsetHeight;
        length = (dim !== 0) ? dim :
         window.parseInt(this.element.getStyle('height'), 10);
      } else {
        dim = this.element.offsetWidth;
        length = (dim !== 0) ? dim :
         window.parseInt(this.element.getStyle('width'), 10);
      }

      this._trackLength = length;
      return length;
    },

    _computeHandleLength: function() {
      var handle = this.handles.first(), length, dim;

      if (!handle) return;

      if (this.orientation === 'vertical') {
        dim = handle.offsetHeight;
        length = (dim !== 0) ? dim :
         window.parseInt(handle.getStyle('height'), 10);
        this._trackMargin = handle.getLayout().get('margin-top');
        this._trackLength -= 2 * this._trackMargin;
      } else {
        dim = handle.offsetWidth;
        length = (dim !== 0) ? dim :
         window.parseInt(handle.getStyle('width'), 10);
         this._trackMargin = handle.getLayout().get('margin-left');
         this._trackLength -= 2 * this._trackMargin;
      }

      this._handleLength = length;
      return length;
    },

    _nextValue: function(currentValue, direction) {
      if (this.options.possibleValues) {
        var index = this._possibleValues.indexOf(currentValue);
        return this._possibleValues[index + direction];
      } else {
        return currentValue + (this.keyboardStep * direction);
      }
    },

    keydown: function(event) {
      if (this.options.disabled) return;

      var handle = event.findElement();
      var index  = handle.retrieve('ui.slider.handle');
      var allow = true, opt = this.options;

      if (!Object.isNumber(index)) return;

      var interceptKeys = [Event.KEY_HOME, Event.KEY_END, Event.KEY_UP,
       Event.KEY_DOWN, Event.KEY_LEFT, Event.KEY_RIGHT];

      if (!interceptKeys.include(event.keyCode)) {
        return;
      }

      handle.addClassName('ui-state-active');

      var currentValue, newValue, step = this.keyboardStep;
      currentValue = newValue = this.values[index];

      switch (event.keyCode) {
      case Event.KEY_HOME:
        newValue = opt.value.min; break;
      case Event.KEY_END:
        newValue = opt.value.max; break;
      case Event.KEY_UP: // fallthrough
      case Event.KEY_RIGHT:
        if (currentValue === opt.value.max) return;
        newValue = this._nextValue(currentValue, 1);
        break;
      case Event.KEY_DOWN: // fallthrough
      case Event.KEY_LEFT:
        if (currentValue === opt.value.min) return;
        newValue = this._nextValue(currentValue, -1);
        break;
      }

      this.dragging = true;
      this.setValue(newValue, index);

      if (!Prototype.Browser.WebKit) {
        var interval = this._timer ? 0.1 : 1;
        this._timer = arguments.callee.bind(this).delay(interval, event);
      }

      if (!allow) {
        event.stop();
      }
    },

    keyup: function(event) {
      this.dragging = false;
      if (this._timer) {
        window.clearTimeout(this._timer);
        this._timer = null;
      }
      this._updateFinished();

      var handle = event.findElement();
      handle.removeClassName('ui-state-active');
    },

    setValue: function(sliderValue, handleIndex) {
      if (!this.activeHandle) {
        this.activeHandle = this.handles[handleIndex || 0];
        this._updateStyles();
      }

      handleIndex = handleIndex ||
       this.activeHandle.retrieve('ui.slider.handle') || 0;

      if (this.initialized && this.restricted) {
        if (handleIndex > 0 && sliderValue < this.values[handleIndex - 1]) {
          sliderValue = this.values[handleIndex - 1];
        }
        if (handleIndex < (this.handles.length - 1) &&
         (sliderValue > this.values[handleIndex + 1])) {
          sliderValue = this.values[handleIndex + 1];
        }
      }

      sliderValue = this._getNearestValue(sliderValue);

      this.values[handleIndex] = sliderValue;

      var prop = (this.orientation === 'vertical') ? 'top' : 'left';
      var css = {};

      css[prop] = this._valueToPx(sliderValue) + 'px';
      this.handles[handleIndex].setStyle(css);

      this._drawRange();

      if (!this.dragging && !this.undoing && !this.initialized)  {
        this._updateFinished();
      }

      if (this.initialized) {
        this.element.fire("ui:slider:value:changing", {
          slider: this,
          values: this.values
        });
        this.options.onSlide(this.values, this);
      }

      return this;
    },

    _getNearestValue: function(value) {
      var range = this.options.value;

      if (value < range.min) value = range.min;
      if (value > range.max) value = range.max;

      if (this._possibleValues) {
        var left, right;
        for (var i = 0; i < this._possibleValues.length; i++) {
          right = this._possibleValues[i];
          if (right === value)  return value;
          if (right > value)    break;
        }
        left = this._possibleValues[i - 1];
        value = value.nearer(left, right);
      }

      return value;
    },

    _valueToPx: function(value) {
      var range = this.options.value;
      var pixels = (this._trackLength - this._handleLength ) /
       (range.max - range.min);
      pixels *= (value - range.min);

      if (this.orientation === 'vertical') {
        pixels = (this._trackLength - pixels) - this._handleLength;
      } else {
      }

      return Math.round(pixels);
    },

    mousedown: function(event) {
      var opt = this.options;
      if (!event.isLeftClick() || opt.disabled) return;
      event.stop();

      this._oldValues = this.values.clone();

      this.active = true;
      var target  = event.findElement();
      var pointer = event.pointer();

      if (target === this.element) {
        var trackOffset = this.element.cumulativeOffset();

        var newPosition = {
          x: Math.round(pointer.x - trackOffset.left - this._handleLength / 2 - this._trackMargin),
          y: Math.round(pointer.y - trackOffset.top - this._handleLength / 2 - this._trackMargin)
        };

        this.setValue(this._pxToValue(newPosition));

        this.activeHandle = this.activeHandle || this.handles.first();
        handle = this.activeHandle;
        this._updateStyles();
        this._offsets = {x: 0, y: 0};
      } else {
        handle = event.findElement('.ui-slider-handle');
        if (!handle) return;

        this.activeHandle = handle;
        this._updateStyles();
        var handleOffset = handle.cumulativeOffset();
        this._offsets = {
          x: pointer.x - (handleOffset.left + this._handleLength / 2),
          y: pointer.y - (handleOffset.top + this._handleLength / 2)
        };
      }

      document.observe('mousemove', this.observers.mousemove);
      document.observe('mouseup',   this.observers.mouseup);
    },

    mouseup: function(event) {
      if (this.active && this.dragging) {
        this._updateFinished();
        event.stop();
      }

      this.active = this.dragging = false;

      this.activeHandle = null;
      this._updateStyles();

      document.stopObserving('mousemove', this.observers.mousemove);
      document.stopObserving('mouseup',   this.observers.mouseup);
    },


    mousemove: function(event) {
      if (!this.active) return;
      event.stop();

      this.dragging = true;
      this._draw(event);

      if (Prototype.Browser.WebKit) window.scrollBy(0, 0);
    },

    rangeMouseDown: function(event) {
      var pointer = event.pointer();

      var trackOffset = this.element.cumulativeOffset();

      var newPosition = {
        x: Math.round(pointer.x - trackOffset.left),
        y: Math.round(pointer.y - trackOffset.top)
      };

      this._rangeInitialValues = this.values.clone();
      this._rangePseudoValue = this._pxToValue(newPosition);

      document.observe('mousemove', this.observers.rangeMouseMove);
      document.observe('mouseup',   this.observers.rangeMouseUp);
    },

    rangeMouseMove: function(event) {
      this.dragging = true;
      event.stop();

      var opt = this.options;

      var pointer = event.pointer();
      var trackOffset = this.element.cumulativeOffset();

      var newPosition = {
        x: Math.round(pointer.x - trackOffset.left),
        y: Math.round(pointer.y - trackOffset.top)
      };

      var value = this._pxToValue(newPosition);
      var valueDelta = value - this._rangePseudoValue;
      var newValues = this._rangeInitialValues.map(
       function(v) { return v + valueDelta; });

      if (newValues[0] < opt.value.min) {
        valueDelta = opt.value.min - this._rangeInitialValues[0];
        newValues = this._rangeInitialValues.map(
         function(v) { return v + valueDelta; });
      } else if (newValues[1] > opt.value.max) {
        valueDelta = opt.value.max - this._rangeInitialValues[1];
        newValues = this._rangeInitialValues.map(
         function(v) { return v + valueDelta; });
      }

      newValues.each(this.setValue, this);
    },

    rangeMouseUp: function(event) {
      this.dragging = false;

      document.stopObserving('mousemove', this.observers.rangeMouseMove);
      document.stopObserving('mouseup',   this.observers.rangeMouseUp);

      this._updateFinished();
    },


    _draw: function(event) {
      var pointer = event.pointer();
      var trackOffset = this.element.cumulativeOffset();

      pointer.x -= (this._offsets.x + trackOffset.left + this._handleLength / 2 + this._trackMargin);
      pointer.y -= (this._offsets.y + trackOffset.top + this._handleLength / 2 + this._trackMargin);

      this.setValue(this._pxToValue(pointer));
    },

    _pxToValue: function(offsets) {
      var opt = this.options;
      var offset = (this.orientation === 'horizontal') ?
       offsets.x : offsets.y;

      var value = ((offset / (this._trackLength - this._handleLength) *
       (opt.value.max - opt.value.min)) + opt.value.min);

      if (this.orientation === 'vertical') {
        value = opt.value.max - (value - opt.value.min);
      }

      return value;
    },

    undo: function() {
      if (!this._oldValues) return;
      this.values = this._oldValues.clone();

      this.undoing = true;
      this._oldValues.each(this.setValue, this);
      this.undoing = false;
    },

    _updateFinished: function() {
      var result = this.element.fire("ui:slider:value:changed", {
        slider: this,
        values: this.values
      });

      if (result.stopped) {
        this.undo();
        return;
      }

      this.activeHandle = null;
      this._updateStyles();

      this.options.onChange(this.values, this);
    },

    _updateStyles: function() {
      UI.removeClassNames(this.handles, 'ui-state-active');
      if (this.activeHandle) {
        this.activeHandle.addClassName('ui-state-active');
      }
    },

    _drawRange: function() {
      if (!this.range) return;
      var values = this.values, pixels = values.map(this._valueToPx, this);

      if (this.orientation === 'vertical') {
        this.range.setStyle({
          top: pixels[1] + 'px',
          height: (pixels[0] - pixels[1]) + 'px'
        });
      } else {
        this.range.setStyle({
          left:   pixels[0] + 'px',
          width:  (pixels[1] - pixels[0]) + 'px'
        });
      }
    },

    focus: function(event) {
      if (this.options.disabled) return;

      var handle = event.findElement();

      this.element.select('.ui-state-focus').invoke(
       'removeClassName', 'ui-state-focus');

      handle.addClassName('ui-state-focus');
    },

    blur: function(event) {
      event.findElement().removeClassName('ui-state-focus');
    }
  });

  Object.extend(UI.Slider, {
    DEFAULT_OPTIONS: {
      range: false,
      disabled: false,
      value: { min: 0, max: 100, initial: 0, step: null },
      possibleValues: null,
      orientation: 'horizontal',

      onSlide:  Prototype.emptyFunction,
      onChange: Prototype.emptyFunction
    }
  });
})(S2.UI);

(function(UI) {
  UI.ProgressBar = Class.create(UI.Base, {
    NAME: "S2.UI.ProgressBar",

    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-progressbar ui-widget ' +
       'ui-widget-content ui-corner-all');

      this.element.writeAttribute({
        'role': 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': 0
      });

      this.valueElement = new Element('div', {
        'class': 'ui-progressbar-value ui-widget-header ui-corner-left'
      });

      this.value = opt.value.initial;
      this._refreshValue();

      this.element.insert(this.valueElement);
      this.element.store(this.NAME, this);
    },

    destroy: function() {
      UI.removeClassNames(this.element, 'ui-progressbar ui-widget ' +
       'ui-widget-content ui-corner-all');
      UI.removeAttributes(this.element, 'role aria-valuemin aria-valuemax ' +
       'aria-valuenow');
      this.element.getData().unset(this.NAME);
    },

    getValue: function() {
      var value = this.value, v = this.options.value;
      if (value < v.min) value = v.min;
      if (value > v.max) value = v.max;
      return value;
    },

    setValue: function(value) {
      this._oldValue = this.getValue();
      this.value = value;
      this._refreshValue();
      return this;
    },

    undo: function() {
      this.undoing = true;
      this.setValue(this._oldValue);
      this.undoing = false;
      return this;
    },

    _refreshValue: function() {
      var value = this.getValue();
      if (!this.undoing) {
        var result = this.element.fire('ui:progressbar:value:changed', {
          progressBar: this,
          value: value
        });
        if (result.stopped) {
          this.undo();
          return;
        }
      }
      if (value === this.options.value.max) {
        this.valueElement.addClassName('ui-corner-right');
      } else {
        this.valueElement.removeClassName('ui-corner-right');
      }


      var width    = window.parseInt(this.element.getStyle('width'), 10);
      var newWidth = (width * value) / 100;
      var css      = "width: #{0}px".interpolate([newWidth]);

      UI.makeVisible(this.valueElement, (value > this.options.value.min));
      this.valueElement.morph(css, { duration: 0.7, transition: 'linear' });
      this.element.writeAttribute('aria-valuenow', value);
    }
  });

  Object.extend(UI.ProgressBar, {
    DEFAULT_OPTIONS: {
      value: { min: 0, max: 100, initial: 0 }
    }
  });

})(S2.UI);

(function(UI) {
  UI.Menu = Class.create(UI.Base, UI.Mixin.Shim, UI.Mixin.Element, {
    NAME: "S2.UI.Menu",

    initialize: function(element, options) {
      this.element = $(element);
      if (!this.element) {
        var options = element;
        this.element = new Element('ul', { 'class': 'ui-helper-hidden' });
      }

      this.activeId = this.element.identify() + '_active';
      var opt = this.setOptions();

      UI.addClassNames(this.element, 'ui-widget ui-widget-content ' +
       'ui-menu ui-corner-' + opt.corner);

      this.choices = this.element.select('li');

      this._highlightedIndex = -1;

      this.element.writeAttribute({
        'role': 'menu',
        'aria-activedescendant': this.activeId
      });

      this.choices.invoke('writeAttribute', 'role', 'menuitem');

      this.observers = {
        mouseover: this._mouseover.bind(this),
        click: this._click.bind(this)
      };
      this.addObservers();

      this._shown = false;

      this.createShim();

    },

    addObservers: function() {
      this.observe('mouseover', this.observers.mouseover);
      this.observe('mouseup',   this.observers.click    );
    },

    removeObservers: function() {
      this.stopObserving('mouseover', this.observers.mouseover);
      this.stopObserving('mouseup',   this.observers.click    );
    },

    clear: function() {
      this.element.select('li').invoke('remove');
      this.choices = [];
      return this;
    },

    addChoice: function(choice) {
      var li;
      if (Object.isElement(choice)) {
        if (choice.tagName.toUpperCase() === 'LI') {
          li = choice;
        } else {
          li = new Element('li');
          li.insert(choice);
        }
      } else {
        li = new Element('li');
        li.update(choice);
      }

      li.addClassName('ui-menu-item');
      li.writeAttribute('role', 'menuitem');

      this.element.insert(li);
      this.choices = this.element.select('li');

      return li;
    },

    _mouseover: function(event) {
      var li = event.findElement('li');
      if (!li) return;

      this.highlightChoice(li);
    },

    _click: function(event) {
      var li = event.findElement('li');
      if (!li) return;

      this.selectChoice(li);
    },

    moveHighlight: function(delta) {
      this._highlightedIndex = (this._highlightedIndex + delta).constrain(
       -1, this.choices.length - 1);

      this.highlightChoice();
      return this;
    },

    highlightChoice: function(element) {
      var choices = this.choices, index;

      if (Object.isElement(element)) {
        index = choices.indexOf(element);
      } else if (Object.isNumber(element)) {
        index = element;
      } else {
        index = this._highlightedIndex;
      }

      UI.removeClassNames(this.choices, 'ui-state-active');
      if (index === -1) return;
      this.choices[index].addClassName('ui-state-active');
      this._highlightedIndex = index;

      var active = this.element.down('#' + this.activeId);
      if (active) active.writeAttribute('id', '');
      this.choices[index].writeAttribute('id', this.activeId);
    },

    selectChoice: function(element) {
      var element;
      if (Object.isNumber(element)) {
        element = this.choices[element];
      } else if (!element) {
        element = this.choices[this._highlightedIndex];
      }

      var result = this.element.fire('ui:menu:selected', {
        instance: this,
        element: element
      });

      if (!result.stopped) {
        this.close();
      }

      return this;
    },

    open: function() {

      var result = this.element.fire('ui:menu:before:open', { instance: this });
        this.element.removeClassName('ui-helper-hidden');
        this._highlightedIndex = -1;

      if (Prototype.Browser.IE) {
        this.adjustShim();
      }

      this.element.fire('ui:menu:after:open', { instance: this });
    },

    close: function() {
      var result = this.element.fire('ui:menu:before:close', { instance: this });
        this.element.addClassName('ui-helper-hidden');
      return this;

      this.element.fire('ui:menu:after:close', { instance: this });
    },

    isOpen: function() {
      return !this.element.hasClassName('ui-helper-hidden');
    }
  });

  Object.extend(UI.Menu, {
    DEFAULT_OPTIONS: {
      corner: 'all'
    }
  });

})(S2.UI);


(function(UI) {

  UI.Autocompleter = Class.create(UI.Base, {
    NAME: "S2.UI.Autocompleter",

    initialize: function(element, options) {
      this.element = $(element);
      var opt = this.setOptions(options);

      UI.addClassNames(this.element, 'ui-widget ui-autocompleter');

      this.input = this.element.down('input[type="text"]');

      if (!this.input) {
        this.input = new Element('input', { type: 'text' });
        this.element.insert(this.input);
      }

      this.input.insert({ before: this.button });
      this.input.setAttribute('autocomplete', 'off');

      this.name = opt.parameterName || this.input.readAttribute('name');

      if (opt.choices) {
        this.choices = opt.choices.clone();
      }

      this.menu = new UI.Menu();
      this.element.insert(this.menu.element);

      (function() {
        var iLayout = this.input.getLayout();
        this.menu.element.setStyle({
          left: iLayout.get('left') + 'px',
          top:  (iLayout.get('top') + iLayout.get('margin-box-height')) + 'px'
        });
      }).bind(this).defer();

      this.observers = {
        blur: this._blur.bind(this),
        keyup: this._keyup.bind(this),
        keydown: this._keydown.bind(this),
        selected: this._selected.bind(this)
      };

      this.addObservers();
    },

    addObservers: function() {
      this.input.observe('blur',    this.observers.blur);
      this.input.observe('keyup',   this.observers.keyup);
      this.input.observe('keydown', this.observers.keydown);

      this.menu.element.observe('ui:menu:selected',
       this.observers.selected);
    },

    _schedule: function() {
      this._unschedule();
      this._timeout = this._change.bind(this).delay(this.options.frequency);
    },

    _unschedule: function() {
      if (this._timeout) window.clearTimeout(this._timeout);
    },

    _keyup: function(event) {
      var value = this.input.getValue();

      if (value) {
        if (value.blank() || value.length < this.options.minCharacters) {
          this.menu.close();
          this._unschedule();
          return;
        }
        if (value !== this._value) {
          this._schedule();
        }
      } else {
        this.menu.close();
        this._unschedule();
      }

      this._value = value;
    },

    _keydown: function(event) {
      if (UI.modifierUsed(event)) return;
      if (!this.menu.isOpen()) return;

      var keyCode = event.keyCode || event.charCode;

      switch (event.keyCode) {
        case Event.KEY_UP:
          this.menu.moveHighlight(-1);
          event.stop();
          break;
        case Event.KEY_DOWN:
          this.menu.moveHighlight(1);
          event.stop();
          break;
        case Event.KEY_TAB:
          this.menu.selectChoice();
          break;
        case Event.KEY_RETURN:
          this.menu.selectChoice();
          this.input.blur();
          event.stop();
          break;
        case Event.KEY_ESC:
          this.input.setValue('');
          this.input.blur();
          break;
      }
    },

    _getInput: function() {
      return this.input.getValue();
    },

    _setInput: function(value) {
      this.input.setValue(value);
    },

    _change: function() {
      this.findChoices();
    },

    findChoices: function() {
      var value = this._getInput();
      var choices = this.choices || [];
      var results = choices.inject([], function(memo, choice) {
        if (choice.toLowerCase().include(value.toLowerCase())) {
          memo.push(choice);
        }
        return memo;
      });

      this.setChoices(results);
    },

    setChoices: function(results) {
      this.results = results;
      this._updateMenu(results);
    },

    _updateMenu: function(results) {
      var opt = this.options;

      this.menu.clear();

      var needle = new RegExp(RegExp.escape(this._value), 'i');
      for (var i = 0, result, li, text; result = results[i]; i++) {
        text = opt.highlightSubstring ?
         result.replace(needle, "<b>$&</b>") :
         text;

        li = new Element('li').update(text);
        li.store('ui.autocompleter.value', result);
        this.menu.addChoice(li);
      }

      if (results.length === 0) {
        this.menu.close();
      } else {
        this.menu.open();
      }
    },

    _moveMenuChoice: function(delta) {
      var choices = this.list.down('li');
      this._selectedIndex = (this._selectedIndex + delta).constrain(
       -1, this.results.length - 1);

      this._highlightMenuChoice();
    },

    _highlightMenuChoice: function(element) {
      var choices = this.list.select('li'), index;

      if (Object.isElement(element)) {
        index = choices.indexOf(element);
      } else if (Object.isNumber(element)) {
        index = element;
      } else {
        index = this._selectedIndex;
      }

      UI.removeClassNames(choices, 'ui-state-active');
      if (index === -1 || index === null) return;
      choices[index].addClassName('ui-state-active');

      this._selectedIndex = index;
    },

    _selected: function(event) {
      var memo = event.memo, li = memo.element;

      if (li) {
        var value = li.retrieve('ui.autocompleter.value');
        var result = this.element.fire('ui:autocompleter:selected', {
          instance: this,
          value:    value,
        });
        if (result.stopped) return;
        this._setInput(value);
      }
      this.menu.close();
    },

    _blur: function(event) {
      this._unschedule();
      this.menu.close();
    }
  });

  Object.extend(UI.Autocompleter, {
    DEFAULT_OPTIONS: {
      tokens: [],
      frequency: 0.4,
      minCharacters: 1,

      highlightSubstring: true,

      onShow: Prototype.K,
      onHide: Prototype.K
    }
  });

})(S2.UI);


document.observe('dom:loaded',function(){
  if(!S2.enableMultitouchSupport) return;

  var b = $(document.body), sequenceId = 0;

  function initElementData(element){
    element._rotation = element._rotation || 0;
    element._scale = element._scale || 1;
    element._panX = element._panX || 0;
    element._panY = element._panY || 0;
    element._pans = [[0,0],[0,0],[0,0]];
    element._panidx = 1;
  }

  function setElementData(element, rotation, scale, panX, panY){
    element._rotation = rotation;
    element._scale = scale;
    element._panX = panX;
    element._panY = panY;
  }

  function fireEvent(element, data){
    element.fire('manipulate:update',
      Object.extend(data, { id: sequenceId }));
  }

  function setupIPhoneEvent(){
    var element, rotation, scale,
      touches = {}, t1 = null, t2 = null, state = 0, oX, oY,
      offsetX, offsetY, initialDistance, initialRotation;
    function updateTouches(touchlist){
      var i = touchlist.length;
      while(i--) touches[touchlist[i].identifier] = touchlist[i];
      var l = []; for(k in touches) l.push(k); l = l.sort();
      t1 = l.length > 0 ? l[0] : null;
      element = t1 ? touches[t1].target : null;
      if(element && element.nodeType==3) element = element.parentNode;
      t2 = l.length > 1 ? l[1] : null;
      if(state==0 && (t1&&t2)) {
        offsetX = (touches[t1].pageX-touches[t2].pageX).abs();
        offsetY = (touches[t1].pageY-touches[t2].pageY).abs();
        if(element) initElementData(element);
        initialDistance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);
        initialRotation = Math.atan2(touches[t2].pageY-touches[t1].pageY,touches[t2].pageX-touches[t1].pageX);
        state = 1;
        return;
      }
      if(state==1 && !(t1&&t2)) {
        if(element) setElementData(element, rotation, scale);
        state = 0;
      }
    }
    function touchCount(){
      var c=0; for(k in touches) c++; return c;
    }

    b.observe('touchstart', function(event){
      var t = t1, o;
      updateTouches(event.changedTouches);
      if(t==null && t1) {
        o = element.viewportOffset();
        oX = o.left+(touches[t1].pageX-o.left), oY = o.top+(touches[t1].pageY-o.top);
      }
      event.stop();
    });
    b.observe('touchmove', function(event){
      updateTouches(event.changedTouches);
      if(t1&&!t2) {
        fireEvent(element, {
          panX: (element._panX||0)+touches[t1].pageX-oX,
          panY: (element._panY||0)+touches[t1].pageY-oY,
          scale: element._scale,
          rotation: element._rotation
        });
        event.stop();
        return;
      }
      if(!(t1&&t2)) return;
      var a = touches[t2].pageX-touches[t1].pageX,
        b = touches[t2].pageY-touches[t1].pageY,
        cX = (element._panX||0) + touches[t2].pageX - a/2 - oX,
        cY = (element._panY||0) + touches[t2].pageY - b/2 - oY,
        distance = Math.sqrt(a*a + b*b);

      scale = element._scale * distance/initialDistance;
      rotation = element._rotation + Math.atan2(b,a) - initialRotation;

      fireEvent(element, { rotation: rotation, scale: scale, panX: cX, panY: cY });
      event.stop();
    });
    ['touchcancel','touchend'].each(function(eventName){
      b.observe(eventName, function(event){
        var i = event.changedTouches.length;
        while(i--) delete(touches[event.changedTouches[i].identifier]);
        updateTouches([]);
        if(element) setElementData(element, rotation, scale);
      });
    });
  }

  function setupBridgedEvent(){
    var element, rotation, scale, panX, panY, active = false;

    b.observe('touchstart', function(event){
      event.preventDefault();
    });

    b.observe('transformactionstart', function(event){
      event.stop();

      element = event.element();
      initElementData(element);
      active = true;
    });
    b.observe('transformactionupdate', function(event){
      element = event.element();
      rotation = element._rotation + event.rotate;
      scale = element._scale * event.scale;
      panX = element._panX + event.translateX;
      panY = element._panY + event.translateY;

      fireEvent(element, {
        rotation: rotation, scale: scale,
        panX: panX, panY: panY,
        clientX: event.clientX, clientY: event.clientY
      });
      event.stop();
    }, false);
    b.observe('transformactionend', function(event){
      element = event.element();
      if(element) setElementData(element, rotation, scale, panX, panY);
      active = false;

      var speed = Math.sqrt(event.panSpeedX*event.panSpeedX +
          event.panSpeedY*event.panSpeedY);

      if(speed>25){
        element.fire('manipulate:flick', {
          speed: speed,
          direction: Math.atan2(event.panSpeedY,event.panSpeedX)
        });
      }
    });
    b.on('mousemove', function(event){
      event.stop();
    });
    b.on('mousedown', function(event){
      event.stop();
    });
    b.on('mouseup', function(event){
      event.stop();
    });
  }

  function setupGenericEvent(){
    var mX, mY, active = false, listen = true, element, mode,
      initialDistance, initialRotation, oX, oY, rotation, scale, distance;
    function objectForScaleEvent(event){
      var o = element.viewportOffset(),
        a = (event.pageX-o.left)-mX,
        b = (event.pageY-o.top)-mY;
      distance = Math.sqrt(a*a + b*b);
      scale = element._scale * distance/initialDistance;
      rotation = element._rotation + Math.atan2(b,a) - initialRotation;
      return {
        rotation: rotation, scale: scale,
        panX: element._panX, panY: element._panY };
    }
    function objectForPanEvent(event){
      return {
        rotation: element._rotation, scale: element._scale,
        panX: element._panX+event.pageX-oX, panY: element._panY+event.pageY-oY };
    }
    b.observe('mousedown', function(event){
      mode = event.shiftKey ? 'scale' : 'pan';
      element = event.element();
      if(!(element && element.fire)) return;
      sequenceId++;
      active = true;
      initElementData(element);
      var o =  element.viewportOffset();
      mX = element.offsetWidth/2;
      mY = element.offsetHeight/2;
      var a = event.pageX-o.left-mX, b = event.pageY-o.top-mY;
      initialDistance = Math.sqrt(a*a+b*b);
      initialRotation = Math.atan2(b,a);
      oX = o.left+(event.pageX-o.left), oY = o.top+(event.pageY-o.top);
      event.stop();
    });
    b.observe('mousemove', function(event){
      if(!active) return;
      fireEvent(element, mode == 'scale' ? objectForScaleEvent(event) : objectForPanEvent(event));
    });
    b.observe('mouseup', function(event){
      if(!active) return;
      active = false;
      if(mode=='scale'){
        var o = objectForScaleEvent(event);
        fireEvent(element, o);
        element._rotation = o.rotation;
        element._scale = o.scale;
      } else {
        fireEvent(element, objectForPanEvent(event));
        element._panX = element._panX+event.pageX-oX;
        element._panY = element._panY+event.pageY-oY;
      }
    });
    b.observe('dragstart', function(event){ event.stop(); });
  }

  try {
    document.createEvent("TransformActionEvent");
    return setupBridgedEvent();
  } catch(e) {}

  try {
    document.createEvent("TouchEvent");
    return setupIPhoneEvent();
  } catch(e) {}

  return setupGenericEvent();
});
