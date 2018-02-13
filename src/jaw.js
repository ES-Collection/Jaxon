/*
    Jaw v1.2.1

    Bruno Herfst, 2017
    https://github.com/GitBruno/Jaw

*/
/*

  JSON Schema Instantiator
  
  https://github.com/tomarad/JSON-Schema-Instantiator
  
  The MIT License (MIT)

  Copyright (c) 2015 Tom Arad

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
  and associated documentation files (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
  and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
  subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies 
  or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
  PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE 
  FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var Instantiator = function() {
    //////////////
    // privates //
    //////////////
    
    'use strict';
    
    // The JSON Object that defines the default values of certain types.
    var typesInstantiator = {
      'string': '',
      'number': 0,
      'integer': 0,
      'null': null,
      'boolean': false, // Always stay positive?
      'object': { }
    };

    /**
     * Checks whether a variable is a primitive.
     * @param obj - an object.
     * @returns {boolean}
     */
    function isPrimitive(obj) {
      var type = obj.type;

      return typesInstantiator[type] !== undefined;
    }

    /**
     * Checks whether a property is on required array.
     * @param property - the property to check.
     * @param requiredArray - the required array
     * @returns {boolean}
     */
    function isPropertyRequired(property, requiredArray) {
      var found = false;
      requiredArray = requiredArray || [];
      requiredArray.forEach(function(requiredProperty) {
          if (requiredProperty === property) {
            found = true;
          }
      });
      return found;
    }


    function shouldVisit(property, obj, options) {
        return (!options.requiredPropertiesOnly) || (options.requiredPropertiesOnly && isPropertyRequired(property, obj.required));
    }

    /**
     * Instantiate a primitive.
     * @param val - The object that represents the primitive.
     * @returns {*}
     */
    function instantiatePrimitive(val) {
      var type = val.type;

      // Support for default values in the JSON Schema.
      if (val.default) {
        return val.default;
      }

      return typesInstantiator[type];
    }

    /**
     * Checks whether a variable is an enum.
     * @param obj - an object.
     * @returns {boolean}
     */
    function isEnum(obj) {
      return Object.prototype.toString.call(obj.enum) === '[object Array]';
    }

    /**
     * Checks whether a variable is an array.
     * @param obj - an object.
     * @returns {boolean}
     */
    function isArray(obj) {
      return Array.isArray(obj);
    }

    /**
     * Extracts the type of the object.
     * If the type is an array, set type to first in list of types.
     * If obj.type is not overridden, it will fail the isPrimitive check.
     * Which internally also checks obj.type.
     * @param obj - An object.
    */
    function getObjectType(obj) {
      // Check if type is array of types.
      if (isArray(obj.type)) {
        obj.type = obj.type[0];
      }

      return obj.type;
    }

    /**
     * Instantiate an enum.
     * @param val - The object that represents the primitive.
     * @returns {*}
     */
    function instantiateEnum(val) {
      // Support for default values in the JSON Schema.
      if (val.default) {
          return val.default;
      }
      if (!val.enum.length) {
          return undefined;
      }
      return val.enum[0];
    }

    /**
     * The main function.
     * Calls sub-objects recursively, depth first, using the sub-function 'visit'.
     * @param schema - The schema to instantiate.
     * @returns {*}
     */
    function instantiate(schema, options) {
      options = options || {};

      // Set requiredPropertiesOnly to true if not defined
      if ( typeof options.requiredPropertiesOnly === 'undefined') options.requiredPropertiesOnly = true;
  
      /**
       * Visits each sub-object using recursion.
       * If it reaches a primitive, instantiate it.
       * @param obj - The object that represents the schema.
       * @param name - The name of the current object.
       * @param data - The instance data that represents the current object.
       */
      function visit(obj, name, data) {
        if (!obj) {
          return;
        }

        var i;
        var type = getObjectType(obj);

        // We want non-primitives objects (primitive === object w/o properties).
        if (type === 'object' && obj.properties) {
          data[name] = data[name] || { };

          // Visit each property.
          for (var property in obj.properties) {
            if (obj.properties.hasOwnProperty(property)) {
              if (shouldVisit(property, obj, options)) {
                visit(obj.properties[property], property, data[name]);
              }
            }
          }
        } else if (obj.allOf) {
          for (i = 0; i < obj.allOf.length; i++) {
            visit(obj.allOf[i], name, data);
          }
        } else if (type === 'array') {
          data[name] = [];
          var len = 0;
          if (obj.minItems || obj.minItems > 0) {
            len = obj.minItems;
          }

          // Instantiate 'len' items.
          for (i = 0; i < len; i++) {
            visit(obj.items, i, data[name]);
          }
        } else if (isEnum(obj)) {
          data[name] = instantiateEnum(obj);
        } else if (isPrimitive(obj)) {
          data[name] = instantiatePrimitive(obj);
        }
      }

      var data = {};
      visit(schema, 'kek', data);
      return data['kek'];
    }

    ////////////
    // expose //
    ////////////
    return {
        instantiate : instantiate
    };
}();
/*
 * Jassi v0.1.2
 * https://github.com/iclanzan/jassi
 *
 * Copyright (c) 2014 Sorin Iclanzan <sorin@iclanzan.com>
 * License: https://github.com/iclanzan/jassi
 */


var Validator = function() {
    //////////////
    // privates //
    //////////////
    
    
    'use strict';

    var isArray = Array.isArray;
    var keys = Object.keys;

    /**
     * Check if a given value is an instance of a JSON object.
     * This means that arrays and the null object are not considered objects.
     *
     * @param  {any}     value Any value to be checked
     * @return {Boolean}       Returns true if the value is an instance of a JSON object, false otherwise.
     */
    function isObject(value) {
      return null !== value && typeof value == 'object' && !isArray(value);
    }

    /**
     * Get the type of a value.
     *
     * JSON primitive types:
     * Array, Boolean, Number, null, Object, String
     *
     * @param  {any}    value Any value
     * @return {String}       One of the JSON primitive types.
     */
    function getType(value) {
      if( isObject(value) ) return 'object';
      if( isArray (value) ) return 'array';
      if( null === value  ) return 'null';
      return typeof value;     
    }

    /**
     * Check if two items are equal as per the JSON Schema spec.
     *
     * @param  {any}     item1 The first item
     * @param  {any}     item2 The second item
     * @return {Boolean}       Returns true if the items are equal.
     */
    function areEqual(item1, item2) {
      var type1 = getType(item1);
      var type2 = getType(item2);
      var i, l, keys1, keys2, key;

      if (type1 != type2) return false;

      if ('array' == type1) {
        if (item1.length !== item2.length) return false;

        for (i = 0, l = item1.length; i < l; i ++)
          if (!areEqual(item1[i], item2[i])) return false;

        return true;
      }

      if ('object' == type1) {
        keys1 = keys(item1);
        keys2 = keys(item2);

        if (keys1.length !== keys2.length) return false;

        for (i = 0, l = keys1.length; i < l; i ++) {
          key = keys1[i];
          if (!item2.hasOwnProperty(key) || !areEqual(item1[key], item2[key])) return false;
        }

        return true;
      }

      return item1 === item2;
    }

    function or(item1, item2) {
      return undefined !== item1 ? item1 : item2;
    }

    /**
     * Validate a JSON instance against a schema.
     *
     * The function returns an empty array if validation is successful.
     *
     * @param  {any}    instance An instance of a JSON data that needs to be validated
     * @param  {Object} schema   The schema to validate the instance against
     * @param  {String} path     Optional. The path to the property that is being validated.
     * @return {Array}           An array of objects describing validation errors.
     */
    var validate = function(instance, schema, path) {
      var errors = [], type, l, i, j, items, itemsIsArray, additional, additionalIsObject, found, properties, pattern, pp;

      function addError(message) {
        errors.push({property:path, message: message});
        return errors;
      }

      if (undefined === path) path = '';

      if (!isObject(schema)) return addError('Invalid schema.');

      type = getType(instance);
      if (schema.type) {
        items = isArray(schema.type) ? schema.type : [schema.type];
        if (!~items.indexOf(type) && (type != 'number' || !~items.indexOf('integer') || instance % 1 != 0)) {
          addError('Invalid type. Was expecting ' + schema.type + ' but found ' + type + '.');
        }
      }

      if ('array' == type) {
        l = instance.length;

        if (schema.items || schema.additionalItems) {
          items = schema.items || {};
          itemsIsArray = isArray(schema.items);

          additional = schema.additionalItems;
          additionalIsObject = isObject(schema.additionalItems);

          if (itemsIsArray && false === additional && l > (j = items.length))
            addError('The instance can only have up to ' + j + ' items.');

          else for (i = 0; i < l; i ++)
            errors = errors.concat(validate(
              instance[i],
              itemsIsArray ? items[i] || additionalIsObject && additional || {} : items,
              path + '[' + i + ']'
            ));
        }

        if (schema.maxItems && l > schema.maxItems)
          addError('There must be a maximum of ' + schema.maxItems + ' item(s) in the array.');

        if (schema.minItems && l < schema.minItems)
          addError('There must be a minimum of ' + schema.minItems + ' item(s) in the array.');

        if (schema.uniqueItems) {
          dance: for (i = 0; i < l; i ++) {
            for (j = i + 1; j < l; j ++) {
              if (areEqual(instance[i], instance[j])) {
                addError("The items in the array must be unique.");
                break dance;
              }
            }
          }
        }
      }

      if ('object' == type) {
        if (schema.maxProperties && keys(instance).length > schema.maxProperties)
          addError('The instance must have at most ' + schema.maxProperties + ' members.');

        if (schema.minProperties && keys(instance).length < schema.minProperties)
          addError('The instance must have at least ' + schema.minProperties + ' members.');

        if (schema.required)
          schema.required.forEach(function(requiredProperty) {
            if (!instance.hasOwnProperty(requiredProperty))
              addError('Required property "' + requiredProperty + '" is missing.');
          });

        if (schema.properties || schema.additionalProperties || schema.patternProperties) {
          properties = or(schema.properties, {});
          pattern = or(schema.patternProperties, {});
          additional = or(schema.additionalProperties, {});
          pp = keys(pattern);
        }

        keys(instance).forEach(function(key) {
          var schemas, dependency;

          if (schema.dependencies && (dependency = schema.dependencies[key])) {
            if (isArray(dependency)) {
              dependency.forEach(function (prop) {
                if (!instance.hasOwnProperty(prop)) {
                  addError('Property "' + key + '" requires "' + prop + '" to also be present.');
                }
              });
            }
            else {
              errors = errors.concat(validate(instance, dependency, path));
            }
          }

          if (
            properties &&
            false === additional &&
            !properties.hasOwnProperty(key) &&
            !(pp && pp.some(function(regex) { return key.match(regex); }))
          )
            addError('The key "' + key + '" is not allowed to be set.');

          else {
            schemas = [];
            if (properties && properties.hasOwnProperty(key))
              schemas.push(properties[key]);
        
            pp && pp.forEach(function(regex) {
              if (key.match(regex) && pattern[regex]) {
                schemas.push(pattern[regex]);
              }
            });

            if (!schemas.length && additional)
              schemas.push(additional);

            schemas.forEach(function(schema) {
              errors = errors.concat(validate(instance[key], schema, path ? path + '.' + key : key));
            });
          }
        });
      }

      if ('string' == type) {
        if (schema.maxLength && instance.length > schema.maxLength)
          addError('The instance must not be more than ' + schema.maxLength + ' character(s) long.');

        if (schema.minLength && instance.length < schema.minLength)
          addError('The instance must be at least ' + schema.minLength + ' character(s) long.');

        if (schema.pattern && !instance.match(schema.pattern))
          addError('Regex pattern /' + schema.pattern + '/ is a mismatch.');
      }

      if ('number' == type) {
        if (schema.multipleOf !== undefined && instance / schema.multipleOf % 1 != 0)
          addError('The instance is required to be a multiple of ' + schema.multipleOf + '.');

        if (schema.maximum !== undefined) {
          if (!schema.exclusiveMaximum && schema.maximum < instance)
            addError('The instance must have a maximum value of ' + schema.maximum + '.');

          if (schema.exclusiveMaximum && schema.maximum <= instance)
            addError('The instance must be lower than ' + schema.maximum + '.');
        }

        if (schema.minimum !== undefined) {
          if (!schema.exclusiveMinimum && schema.minimum > instance)
            addError('The instance must have a minimum value of ' + schema.minimum + '.');

          if (schema.exclusiveMinimum && schema.minimum >= instance)
            addError('The instance must be greater than ' + schema.minimum + '.');
        }
      }

      if (schema['enum']) {
        items = schema['enum'];
        l = items.length;
        for (i = 0, found = 0; i < l && !found; i++)
          if (areEqual(items[i], instance))
            found = 1;

        if (!found) addError('The instance must have one of the following values: ' + items.join(', ') + '.');
      }

      if (schema.allOf) {
        schema.allOf.forEach(function(schema) {
          errors = errors.concat(validate(instance, schema, path));
        });
      }

      if (schema.anyOf) {
        items = schema.anyOf;
        l = items.length;
        for(i = 0, found = 0; i < l && !found; i++)
          if (!validate(instance, items[i], path).length)
            found = 1;

        if (!found) addError('The instance must validate against at least one schema defined by the "anyOf" keyword.');
      }

      if (schema.oneOf) {
        items = schema.oneOf;
        l = items.length;
        for (i = 0, found = 0; i < l; i++)
          if (!validate(instance, items[i], path).length) {
            if (found) {
              addError('The instance must validate against exactly one schema defined by the "oneOf" keyword.');
              break;
            }
            found = 1;
          }

        if (!found) {
          addError('The instance must validate against one schema defined by the "oneOf" keyword.');      
        }
      }

      if (schema.not && !validate(instance, schema.not, path).length)
        addError('The instance must not validate against the schema defined by the "not" keyword.');

      return errors;
    };

    ////////////
    // expose //
    ////////////
    return {
        validate : validate
    };
}();
/*

Copyright (c) 2012 Dmitry Poklonskiy <dimik@ya.ru>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the 'Software'),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included 
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS 
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
IN THE SOFTWARE.

*/

/* Adjusted by Bruno Herfst 2017 to run in ExtendScript */

/**
 * Create the ObjectManager instance.
 * @class Provide methods for reaching into objects and insert the missing parts
 * using dot notation mongodb-style query string.
 * @name ObjectManager
 * @param {Object|Array} [ctx] Object which we want to resolve.
 * @param {String} [delim="."] Delimiter for the query string.
 */
var ObjectManager = function (ctx, delim) {
    "string" === typeof ctx && (delim = ctx, ctx = {}); // Shift params.

    this.ctx = ctx || {};
    this.delim = delim || ".";

    /**
     * Resolve query through context object.
     * @private
     * @function
     * @name manage
     * @param {Object|Array} obj Object which we want to resolve, it will always be this.ctx value.
     * @param {String[]} path Keys/indexes from query.
     * @param {Number} depth How deep do we go.
     * @param {Function} callback Will be called on resolving complete(fail).
     * @param {Boolean} upsert If requested object(s)/array(s) do not exist, insert one.
     * @returns {Object|Array} Link on the last but one object in query path.
     */
    this.manage = function (obj, path, depth, callback, upsert) {
        var err = null, i, key;

        for (i = 0; i < depth; i++) {
            key = path[i];

            if(null != obj) {
                "undefined" === typeof obj[key] && upsert && (obj[key] = isNaN(path[i + 1]) && {} || []); // If next key is an integer - create an array, else create an object.
                if("undefined" === typeof (obj = obj[key])) {
                    break;
                }
            } else {
                err = new TypeError("Cannot read property '%s' of ".replace('%s', key) + (null === obj && 'null' || typeof obj));
                break;
            }
        }
        if(callback) {
            //async(function () {
                callback(err && String(err), !err && obj);
            //});
        } else {
            return err || obj;
        }
    };

    /**
     * Getter method of the ObjectManager.
     * @function
     * @name ObjectManager.find
     * @param {String} [query] Query string. If is not specified or an empty string - return resolved object.
     * @param {Function} [callback] Will be called with 2 params when resolving complete(fail):
     * 1. null or error description string
     * 2. value of the certain object[key] or undefined/false
     * @returns {ObjectManager|Object} If callback is specified return 'this' for chaining calls,
     * else return resolved value (context object if path is empty string or not specified).
     */
    this.find = function (query, callback) {
        "function" === typeof query && (callback = query, query = false); // Shift params if path not specified.

        var path = query && query.split(this.delim) || [],
            result = this.manage(this.ctx, path, path.length, callback);

        if(result instanceof Error) {
            throw result;
        }

        return callback && this || result;
    };

    /**
     * Setter method of the ObjectManager.
     * @function
     * @name ObjectManager.update
     * @param {String} query Query string.
     * @param value What we want to assign.
     * @param {Function} [callback] Will be called with 2 params when assigning complete(fail):
     * 1. null or error description string
     * 2. updated object or false
     * @param {Boolean} [upsert=true] If requested object(s)/array(s) do not exist, insert one.
     * @returns {ObjectManager} For chaining calls.
     */
    this.update = function (query, value, callback, upsert) {
        "boolean" === typeof callback && (upsert = callback, callback = null); // Shift params if callback not specified.

        var path = query && query.split(this.delim) || [],
            depth = path.length - 1,
            lastKey = path[depth],
            upsert = "boolean" === typeof upsert ? upsert : true,
            ctx = this.ctx,
            result = callback || this.manage(ctx, path, depth, callback, upsert),
            set = function (obj, key, val) {
                return null != obj && key ? obj[key] = val :
                    new TypeError("Cannot set property '%s' of ".replace('%s', key) + (null === obj && 'null' || typeof obj));
            };

        if(callback) {
            this.manage(ctx, path, depth, function (err, obj) {
                err || (result = set(obj, lastKey, value)) instanceof Error && (err = String(result));
                callback(err, !err && ctx);
            }, upsert);
        } else {
            if(result instanceof Error || (result = set(result, lastKey, value)) instanceof Error) {
                throw result;
            }
        }

        return this;
    };

    /**
     * Apply function with object as context.
     * @function
     * @name ObjectManager.apply
     * @param {String} query Query string.
     * @param {Function} fn Will be called with this = object, resolved through the query.
     * @param {Array} args Arguments for function call.
     */
    this.apply = function (query, fn, args) {
        return fn.apply(this.find(query), args);
    };

    /**
     * Create a copy of the resolved object.
     * @function
     * @name ObjectManager.copy
     * @param {String} query Query string.
     * @returns {Object|Boolean} Resolved copy or false.
     */
    this.copy = function (query) {
        var result = this.find(query);

        return "object" === typeof result && JSON.parse(JSON.stringify(result));
    };

    /**
     * Create a mixin
     * @function
     * @name ObjectManager.mixin
     * @param {String} query Query string.
     * @returns {Object} Mixin of the resolved
     */
    this.mixin = function () {
        var query = arguments[0],
            ctx = this.find(query),
            result = {},
            hasOwn = Object.prototype.hasOwnProperty,
            extend = function (o1, o2) {
                for (var prop in o2) {
                    hasOwn.call(o2, prop) && (o1[prop] = o2[prop]);
                }

                return o1;
            };

        for (var arg = 1; arg < arguments.length; arg++) {
            result = extend(result, arguments[arg]);
        }

        return extend(result, ctx);
    };

    // Self-invoking constructor
    if(!(this instanceof ObjectManager)) {
        return new ObjectManager(delim);
    }
};



var jaw = function( Schema, instance ) {

    // ref to self
    var Jaw = this;

    function updateReference() {
        // With brute force :)
        if(typeof instance === 'object') {
            var fromObj = Jaw.get();
            Object.keys(instance).forEach(function(key) {
                delete instance[key];
            });
            Object.keys(fromObj).forEach(function(key) {
                instance[key] = fromObj[key];
            });
        }
    }

    var manager = new ObjectManager({});
    var _Schema = {};

    var _isValid = {
        schema  : true ,
        managed : true ,
        all : function(){
            return (this.schema && this.managed);
        }
    };

    var errors = [];

    var errHandler = function(err, obj) {
        //err: null or string with error description "TypeError: cannot set property 'undefined' of number"
        //obj: updated object { a : { b : [{ c : 10 }] } }
        if( typeof err === "string") {
            errors.push(resultErr);
        }
    };

    function setSchema( Schema ){
        // Validate given schema
        _Schema = JSON.clone( Schema );
        // Shema is object, let's make sure it has a type property as well
        errors = Validator.validate( Jaw.getSchema(), {"type": "object","required": ["type"]} );
        if( errors.length > 0 ) {
            _isValid.schema = false;
            errors.unshift("Schema not valid (Missing type property).");
            return;
        }

        // Validating against a fresh instance from schema should always work
        // If not, there is something wrong with the schema
        errors = Validator.validate( Jaw.getTemplate( true ), Jaw.getSchema() );
        if( errors.length > 0 ) {
            errors.unshift("Schema not valid (Could not generate valid instance from shema).");
            _isValid.schema = false;
        }
    };

    function userException(message) {
        this.message = message;
        this.name = 'Error';
    };

    function setObj( newObj ) {
        if(_isValid.schema) {
            errors = Validator.validate( newObj, Jaw.getSchema() );
            if( errors.length === 0 ) {
                manager = new ObjectManager(newObj);
                validateManager();
            }
        }
        return Jaw;
    };

    function validateManager(){
      var result = Validator.validate( manager.find(), Jaw.getSchema() );  
      if( result.length > 0 ) {
        errors.push(result);
        _isValid.managed = false;
      } else {
        updateReference();
      }
    };

    //-----------------
    // Public funcions
    //-----------------
    Jaw.copyKeys = function(fromObj, toObj) {
        if( (typeof fromObj !== 'object') ||
            (typeof toObj   !== 'object') ) {
            throw new userException('Jaw.copyKeys(): Two objects expected.');
        }
        Object.keys(fromObj).forEach(function(key) {
            toObj[key] = fromObj[key];
        });
    };

    Jaw.isValid = function() {
        return _isValid.all();
    };

    Jaw.errors = function() {
        if(Array.isArray(errors)) {
            return errors;
        } else {
            return [errors];
        }
    };

    Jaw.wrap = function( givenObj ) {
        var newObj = Instantiator.instantiate( Jaw.getSchema() );
        if(typeof newObj === 'object') {
            // Copy all keys from given object to new object
            Jaw.copyKeys(givenObj, newObj);
        }
        setObj( newObj );
        return Jaw;
    };

    Jaw.getTemplate = function( allProperties ) {
        // allProperties = undefined = false = {requiredPropertiesOnly: true}
        if(typeof allProperties !== 'boolean') {
            var requiredPropertiesOnly = true; // allProperties == false
        } else {
            var requiredPropertiesOnly = !allProperties;
        }
        return Instantiator.instantiate( Jaw.getSchema(), {requiredPropertiesOnly: requiredPropertiesOnly} );
    };

    Jaw.getSchema = function() {
        return JSON.clone(_Schema);
    };

    Jaw.get = function( path ) {
        return manager.find( path );
    };
    
    Jaw.set = function( path, to ) {
        var check = new ObjectManager( JSON.clone( Jaw.get() ) );

        var result = check.update( path, to, function (resultErr) {
          errors.push(resultErr);
        });
        
        var err = Validator.validate( check.find(), Jaw.getSchema() );

        if ( err.length > 0 ) {
          errors.push( err );
        } else {
          manager.update( path, to, errHandler);
          validateManager();
        }
        return Jaw;
    };

    // Array tools
    function unshiftPush( path, unshiftPush, args ) {
        // Param unshiftPush: Boolean true for unshift false for push
        var check = new ObjectManager( JSON.clone( Jaw.get() ) );
        var arr = check.find(path);

        if( arr === undefined || arr === false ) {
            arr = args; // Add new array  
            check.update(path, arr);
        } else if ( Array.isArray(arr) ) {
            if( unshiftPush ) {
                Array.prototype.unshift.apply( arr, args );
            } else {
                Array.prototype.push.apply( arr, args );
            }
            check.update(path, arr);
        } else {
            errors.push("Jaw.pushShift: path does not result in array.");
            return Jaw;
        }

        var err = Validator.validate( check.find(), Jaw.getSchema() );

        if ( err.length > 0 ) {
          errors.push( err );
        } else {
          manager.update( path, arr, errHandler);
          validateManager();
        }
        return Jaw;
    }

    function shiftPop( path, shiftPop ) {
        // Returns element or undefined
        var check = new ObjectManager( JSON.clone( Jaw.get() ) );
        var arr = check.find(path);

        var result = undefined;

        if( arr === undefined || arr === false ) {
            // There is no array at path
            return result; // Same as running pop() or shift() on empty array
        } else if ( Array.isArray(arr) ) {
            if( shiftPop ) {
                result = arr.shift();
            } else {
                result = arr.pop();
            }
        } else {
            errors.push("Jaw.pop: path does not result in array.");
        }

        var err = Validator.validate( check.find(), Jaw.getSchema() );

        if ( err.length > 0 ) {
          errors.push( err );
          return result; 
        } else {
          manager.update( path, arr, errHandler);
          validateManager();
        }
        return result;
    };

    Jaw.push = function( path /* element, element, etc */ ) {
        var args = Array.prototype.slice.call(arguments, Jaw.push.length);
        return unshiftPush( path, false, args );
    };

    Jaw.pop = function ( path ) {
        return shiftPop( path, false );
    }

    Jaw.unshift = function( path /* element, element, etc */ ) {
        var args = Array.prototype.slice.call(arguments, Jaw.unshift.length);
        return unshiftPush( path, true, args );
    };

    Jaw.shift = function ( path ) {
        return shiftPop( path, true );
    };

    Jaw.splice = function( path, index, del /* element, element, etc */ ) {
        var args = Array.prototype.slice.call(arguments, Jaw.splice.length);

        var check = new ObjectManager( JSON.clone( Jaw.get() ) );
        var arr = check.find(path);

        if( arr === undefined || arr === false ) {
            arr = new Array(index+del);
        }

        if ( Array.isArray(arr) ) {
            if( (index+del) <= arr.length ) {
                Array.prototype.splice.apply(arr, [index,del].concat(args) );
                check.update(path, arr);
            } else {
                errors.push("Jaw.splice: index out of range.");
                return Jaw;
            }
        } else {
            errors.push("Jaw.splice: path does not result in array.");
            return Jaw;
        }

        var err = Validator.validate( check.find(), Jaw.getSchema() );

        if ( err.length > 0 ) {
          errors.push( err );
        } else {
          manager.update( path, arr, errHandler);
          validateManager();
        }
        return Jaw;
    };

    function deleteProp( obj, path ) {
        var route = path.split(".");
        while (route.length-1 && (obj = obj[route.shift()]));
        delete obj[route.shift()];
    }

    Jaw.delete = function ( path ) {
        var clone = JSON.clone( Jaw.get() );
        deleteProp( clone, path );
        
        // If any prop is delted that is required add it again
        // This will revert to default value
        Jaw.copyKeys(Jaw.getTemplate( false ), clone);
        
        var check = new ObjectManager( clone );
        var err = Validator.validate( check.find(), Jaw.getSchema() );

        if ( err.length > 0 ) {
          errors.push( err );
        } else {
          Jaw.wrap( clone );
          validateManager();
        }
        return Jaw;
    };

    //-----------------
    // Initialise
    //-----------------
    setSchema( Schema );
    if( errors.length === 0 ) {
        // Start managing something
        manager = new ObjectManager( Jaw.getTemplate( false ) );
    };

    if(Jaw.isValid() && (typeof instance !== 'undefined') ) {
        if(typeof instance === 'boolean') {
            Jaw.wrap(Jaw.getTemplate( instance ) );
        } else if(typeof instance !== 'object') {
            _valid.managed = false;
            errors.unshift("Initialisation Error: Can't get Jaw arround non-object");
        } else {
            Jaw.wrap(instance);
        }
    };

};
