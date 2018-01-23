#include 'es-polyfill.js'
#include 'json-initiator.js'
#include 'json-validator.js'
#include 'object-manager.js'

var jaw = function( Schema, instance ) {
    // ref to self
    var Jaw = this;
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
                _isValid.managed = true;
            }
        }
        return Jaw;
    };

    function copyKeys(fromObj, toObj) {
        if( (typeof fromObj !== 'object') ||
            (typeof toObj   !== 'object') ) {
            throw new userException('copyKeys needs to be given objects');
        }
        Object.keys(fromObj).forEach(function(key) {
            toObj[key] = fromObj[key];
        });
    };

    function validateManager(){
      var result = Validator.validate( manager.find(), Jaw.getSchema() );  
      if( result.length > 0 ) {
        errors.push(result);
        _isValid.managed = false;
      }
    };

    //-----------------
    // Public funcions
    //-----------------
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
            copyKeys(givenObj, newObj);
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

        var errHandler = function(err, obj) {
            //err: null or string with error description "TypeError: cannot set property 'undefined' of number"
            //obj: updated object { a : { b : [{ c : 10 }] } }
            if( typeof err === "string") {
                errors.push(resultErr);
            }
        }

        if ( err.length > 0 ) {
          errors.push( err );
        } else {
          manager.update( path, to, errHandler);
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

    if(Jaw.isValid() && instance) {
        if(typeof instance !== 'object') {
            _valid.managed = false;
            errors.unshift("Initialisation Error: Can't get Jaw arround non-object");
        } else {
            Jaw.wrap(instance);
        }
    };
};