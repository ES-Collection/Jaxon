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


