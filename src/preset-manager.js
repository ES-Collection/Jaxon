/* -------------------------------------------------------------------------------
    
    @param fileName : String
        Name of file to be saved in user data folder
    
    @param Schema : Object
        A schema to validate against. Also used to generate defaults

    @param standardPresets : Array
        Initial presets that are loaded if no presetsFile is found at filePath

------------------------------------------------------------------------------- */

var presetManager = function( fileName, Schema, standardPresets ) {
    // ref to self
    var Jaxon    = this;

    // standard file path
    var filePath = Folder.userData + "/" + String(fileName);
    var valid  = true;
    var errors = [];

    function userException(message) {
        this.message = message;
        this.name = 'Error';
    }

    // S C H E M A S
    //-------------------------
    // Load Jaw for preset and validate preset Schema
    var presetJaw = new jaw( Schema );
    if(!presetJaw.isValid()) {
        throw presetJaw.errors()[0];
    }
    // Create Schema for standardPresets
    // This preset manager works on the premise
    // that presets are objects collected in an array
    var PresetsSchema = { "type": "array", "items": Schema };
    var presetsJaws = new jaw( PresetsSchema );
    if(!presetsJaws.isValid()) {
        throw userException(presetsJaws.errors());
    }

    // Validate standardPresets
    //-------------------------
    if ( typeof standardPresets === 'undefined') standardPresets = [Jaws.getTemplate(true)];
    if ( Array.isArray( standardPresets ) ) {
        standardPresets = JSON.clone( standardPresets );
    } else {
        throw new userException("Param standardPresets needs to be type of array but is " + String(typeof standardPresets));
    }
    if(!presetsJaws.wrap(standardPresets).isValid()) {
        throw userException(presetsJaws.errors());
    }

    //-------------------------------------------------
    // P R I V A T E   F U N C T I O N S
    //-------------------------------------------------

    function createMsg ( bool, comment ) {
        // Standard return obj
        return {success: Boolean(bool), comment: String( comment ) };
    }

    function not_in_array ( arr, element ) {
        for(var i=0; i<arr.length; i++) {
            if (arr[i] == element) return false;
        }
        return true;
    }

    function fileExist ( filePath ) {
        var f = File(filePath);
        if(f.exists){
            return true;
        } else {
            return false;
        }
    }

    function writeFile ( filePath, contentString ) {
        // This function will (over) write a file to file path
        // filePath does not need to exist

        var alertUser = true;

        function error( bool, message ) {
            if(alertUser) {
                alert( "Preset Manager\n" + String(message) );
            }
            try {
                f.close();
            } catch ( err ) {
                // Do nothing
            }
            return createMsg ( bool, message );
        }

        var f = File(filePath);
        
        try {
            // Set character encoding
            f.encoding = "UTF-16";
            
            // Open the file
            if( ! f.open('w') ){
                return error( false, "Error opening file at " + filePath +": "+ f.error );
            }
            // Write to file
            if( ! f.write( String(contentString) ) ){
                return error( false, "Error writing to file at " + filePath +": "+ f.error );
            }
            // Close the file
            if( ! f.close() ){
                return error( false, "Error closing file at " + filePath +": "+ f.error );
            }
        } catch ( r ) {
            return error( false, r.error );
        }

        return createMsg ( true, "Done" );
    }

    function updateObj ( Old_Obj, New_Obj, ignoreKeys ) {
        // This function will try and copy all values
        // from Old_Obj to New_Obj
        for ( var key in New_Obj ) {
            if( Old_Obj.hasOwnProperty(key) ) {
                if ( not_in_array( ignoreKeys, key ) ) {
                    New_Obj[key] = Old_Obj[key];
                }
            }
        }
        return JSON.clone( New_Obj );
    }

    function updatePreset ( oldPreset, ignoreKeys ) {
        var ignoreKeys = ignoreKeys || [];
        if(! ignoreKeys instanceof Array) {
            throw "The function updatePreset expects ignoreKeys to be instance of Array."
        }
        if( oldPreset === undefined ) {
            return presetJaw.getTemplate( true );
        }
        if(! oldPreset instanceof Object) {
            throw "The function updatePreset expects Preset to be instance of Object."
        }
        // Create a copy of the standard preset
        var newPreset = presetJaw.getTemplate( true );
        return updateObj( oldPreset, newPreset, ignoreKeys );
    }


    // P R E S E T   C O N T R O L L E R
    //-------------------------------------------------

    function presetController( Preset ) {
        // This preset controller handles a single preset
        // And will be attached to any preset
        var PresetController = this;
        // Create a fresh template
        var _Preset = new jaw( Schema );

        var temporaryState = false;

        var _hasProp = function( propName ) {
            var Preset = _Preset.get();
            if( Preset.hasOwnProperty( propName ) ){
                return true;
            } else {
                alert("UiPreset does not have property " + propName);
                return false;
            }
        }

        // Public
        //-------
        PresetController.setTemporaryState = function( bool ) {
            temporaryState = bool == true;
            return temporaryState;
        }

        PresetController.getTemporaryState = function( bool ) {
            return temporaryState;
        }

        PresetController.getTemplate = function( allProperties ) {
            // allProperties = undefined = false
            return presetJaw.getTemplate( allProperties );
        }

        PresetController.get = function() {
            return _Preset.get();
        }

        PresetController.load = function( Preset ) {
            _Preset.wrap( updatePreset( Preset ) );
            if(_Preset.errors().length > 0) {
                alert("Could not load preset.\n" + JSON.stringify(_Preset.errors()) );
            }

            return _Preset.get();
        }
        
        // Get and set preset properties
        PresetController.getProp = function( propName ) {
            return _Preset.get( propName );
        }

        PresetController.setProp = function( propName, val ) {
            var prop = String(propName);
            if( _hasProp( prop ) ) {
                _Preset.set(prop, val);
                return JSON.clone( _Preset.get(prop) );
            }
            alert("Could not set preset property.\nProperty " + prop + " does not exist.");
            return undefined;
        }

        // init
        PresetController.load( Preset );

    } // End of presetController


    // P R E S E T S   C O N T R O L L E R
    //-------------------------------------------------

    function presetsController( presets ) {
        // The presets controller handles the presets array

        var PresetsController = this;

        function infuse( presets ) {
            var holder = new Array();
            var len = presets.length;
            for (var i = 0; i < len; i++) {
                holder[i] = new presetController( presets[i] );
            }
            return holder;
        }

        var _Presets = infuse( presets );

        function clean() {
            var holder = new Array();
            var len = _Presets.length;
            for (var i = 0; i < len; i++) {
                holder[i] = _Presets[i].get();
            }
            return holder;
        }

        function cleanSave_presets(){
            // This function removes any temporary preset before saving to disk
            var holder = new Array();
            var len = _Presets.length;
            for (var i = 0; i < len; i++) {
                if(! _Presets[i].getTemporaryState() ) {
                    holder.push( _Presets[i].get() );
                }
            }
            return holder;
        }

        function presetExist( key, val ) {
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                    return true;
                }
            }
            return false;
        }

        function calcIndex( pos, len ) {
            // Calculate actual index
            var i = pos;
            if ( pos < 0 ) {
                i = len - Math.abs(pos);
            }
            return Math.abs(i);
        }

        function outOfRange( pos, len ) {
            var pos = parseInt(pos);
            var len = parseInt(len);
            if( len == 0 ) {
                // Everything is out of range :)
                return true;
            }
            if(pos > len) {
                return true;
            }
            if( pos < -1-len ) {
                return true;
            }
            return false;
        }

        //------------------------------------------
        // Public access

        PresetsController.get = function () {
            return clean();
        }
        
        PresetsController.getTemplate = function() {
            return presetJaw.getTemplate( true );
        }

        PresetsController.getByKey = function ( key, val ) {
            // Sample usage: Jaxon.Presets.getByKey('id',3);
            // Please note that this function returns the first
            // preset it can find
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) === val) {
                   return _Presets[i].get();
                }
            }
            return false;
        }

        PresetsController.getIndex = function ( key, val ) {
            // Sample usage: Jaxon.Presets.getIndex('name','this');
            // returns array with matches
            var matches = new Array();
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) == val) {
                   matches.unshift(i);
                }
            }
            return matches;
        }

        PresetsController.getByIndex = function ( position ) {
            // Sample usage: Jaxon.getPresetByIndex( 3 );
            var len = _Presets.length;
            if( outOfRange( position, len ) ) {
                alert("Preset Manager\nThere is no preset at index " + position);
                return false;
            }
            var i = calcIndex( parseInt(position), len );
            return _Presets[i].get();
        }

        PresetsController.getPropList = function ( key ) {
            if( !Jaxon.UiPreset.get().hasOwnProperty( key ) ) {
                alert("Preset Manager\nCan't create propertylist with key " + key);
                return [];
            }
            var len = _Presets.length;
            var propList = new Array();
            for (var i = 0; i < len; i++) {
                propList[i] = _Presets[i].getProp(key);
            }
            return propList;
        }

        PresetsController.reset = function () {
            _Presets = infuse( standardPresets );
        }

        PresetsController.load = function ( presets ) {
            _Presets = infuse( presets );
            return clean();
        }

        PresetsController.add = function ( preset, options ) {
            // options { position: integer, temporary preset: boolean }
            // para position; index that can handle negative numbers
            // that are calculated from the back -1 == last

            var len = _Presets.length;
            var pos = len;

            if(options && options.hasOwnProperty('position')) {
                pos = options.position;
                if ( isNaN(pos) ) {
                    pos = len;
                }
                if( outOfRange(pos, len) ) {
                    pos = len;
                }
            }

            var i = calcIndex( pos, len+1 );
            var infusedPreset = new presetController( preset );

            if(options && options.hasOwnProperty('temporary')) {
                infusedPreset.setTemporaryState( options.temporary == true );
            }

            _Presets.splice(i, 0, infusedPreset);

            return clean();
        }

        PresetsController.addUnique = function ( Preset, key, options ) {
            // Sample usage: PresetManager.Presets.addUnique( Preset, 'name' );
            var silently = false;
            var position = -1;

            if(options && options.hasOwnProperty('position')) {
                if( !isNaN(options.position) ) position = parseInt(options.position);
            }
            if(options && options.hasOwnProperty('silently')) {
                silently = options.silently == true;
            }
            var exist = presetExist(key, Preset[key]);
            
            if(exist){
                if(silently) {
                    var overwrite = true;
                } else {
                    var overwrite = confirm("Do you want to overwrite the existing preset?");
                }
                if (overwrite) {
                    PresetsController.removeWhere( key, Preset[key] );
                } else {
                    return false;
                }
            }

            var newLen = _Presets.length+1;
            PresetsController.add( Preset, {position: position} );
            return _Presets.length == newLen;
        }
        
        PresetsController.remove = function ( position ) {
            var len = _Presets.length;
            // Check for outside range
            if( outOfRange(position, len) ) {
                alert("Could not remove preset\nOut of range: presets length: " + len + " index to be removed: "  + position);
                return false;
            }
            var i = calcIndex( parseInt(position), len );
            _Presets.splice( i, 1 );
            return true;
        }
        
        PresetsController.overwriteIndex = function ( position, Preset ) {
            PresetsController.remove( position );
            PresetsController.add( Preset, {position: position} );
            return clean();
        }

        PresetsController.removeWhere = function ( key, val ) {
            // Sample usage: Jaxon.Presets.removeWhere('id',3);
            // This function removes any preset that contains key - val match
            // It returns true if any presets have been removed
            var success = false;
            var len = _Presets.length;
            for (var i = len-1; i >= 0; i--) {
                if (_Presets[i].getProp(key) === val) {
                    _Presets.splice( i, 1 );
                    success = true;
                }
            }
            return success;
        }

        PresetsController.saveToDisk  = function ( ) {
            var presetStr = JSON.stringify( cleanSave_presets() );
            return writeFile(filePath, presetStr);
        }

        PresetsController.loadFromDisk  = function () {
            if( !fileExist(filePath) ){
                alert("Cannot load presets.\nNo preset file found at " + filePath);
                return false;
            }

            var PresetsFile = File(filePath);
            PresetsFile.open('r');
            var content = PresetsFile.read();
            PresetsFile.close();

            try {
                var NewPresets = JSON.parse(content);
                _Presets = infuse( NewPresets );
                return true;
            } catch(e) {
                alert("Error reading JSON\n" + e.description);
                return false;
            }
        }
        
        PresetsController.removeFromDisk = function () {
            if( fileExist(filePath) ){
                var PresetsFile = File(filePath);
                PresetsFile.remove();
                return true;
            }
            return false;
        }

    } // End of presetsController

    // W I D G E T 
    //-------------------------------------------------

    function widgetCreator( SUI_Group ) {

        var WidgetCreator = this;
        var DataPort      = { getData: undefined, renderUiPreset: undefined };

        WidgetCreator.get = function () {
            if(DataPort) {
                return DataPort.getData();
            } else {
                return createMsg ( false, "No dataport defined" );
            }
        }

        // Any preset that starts with a locking character can't be deleted by the user
        var lockChars = ['[',']'];
        WidgetCreator.getLockChar = function () {
            return lockChars;
        }

        var ButtonText = {save: "Save Preset", clear: "Clear Preset"};
        WidgetCreator.getButtonText = function () {
            return ButtonText;
        }

        var newName = "New Preset";
        WidgetCreator.getNewPresetName = function () {
            return newName;
        }

        var lastUsedName = "Last Used";
        WidgetCreator.getLastUsedPresetName = function () {
            return lastUsedName;
        }

        // Keep track of which preset this preset is based on
        // This makes it easy to over-ride an existing preset
        var basedOnPresetName = newName;

        var newPresetName      = "";
        var lastUsedPresetName = "";

        function updatePresetNames() {
            newPresetName      = String(lockChars[0] + " " + newName      + " " + lockChars[1]);
            lastUsedPresetName = String(lockChars[0] + " " + lastUsedName + " " + lockChars[1]);
        }

        // This makes it possible to update UI everytime UiPreset is changed
        // Even when the widget is not loaded
        var presetsDrop    = { selection: 0 };
        var presetBut      = { text: "" };
        var presetDropList = [];
        var updateUI       = true;
        var listKey        = "";

        function getDropDownIndex( index, len ) {
            var i = parseInt( index );
            if (i == 0) {
                return i;
            }
            if (i < 0) {
                i += len;
            }
            if (i > len ) {
                i = len;
            }
            return i;
        }

        function createDropDownList(){
            // Check listKey and load dropDown content
            presetDropList = Jaxon.Presets.getPropList( listKey );
            // Add new (clear) preset to dropdown list
            presetDropList.unshift( newPresetName );
        }

        WidgetCreator.activateNew = function () {
            // This function resets the dropdown to first (New Preset)
            updateUI = false;
            presetsDrop.selection = 0;
            presetBut.text = ButtonText.save;
            updateUI = true;
            return createMsg ( true, "Done" );
        }

        WidgetCreator.activateLastUsed = function () {
            // This function resets the dropdown to last (Last Used)
            presetsDrop.selection = Jaxon.Presets.getIndex( listKey, lastUsedPresetName )[0]+1;
            presetBut.text = ButtonText.save;
            return createMsg ( true, "Done" );
        }

        WidgetCreator.saveUiPreset = function () {
            Jaxon.UiPreset.load( DataPort.getData() );
            return createMsg ( true, "Done" );
        }

        WidgetCreator.savePreset = function ( options ) {
            WidgetCreator.saveUiPreset();
            
            // Process Options
            if(options && options.hasOwnProperty('updateProps')) {
                for ( var i = 0; i < options.updateProps.length; i++ ) {
                    Jaxon.UiPreset.setProp( options.updateProps[i].key, options.updateProps[i].value );
                }
            }
        
            var position = -1;
            if( options && options.hasOwnProperty('position') ) {
                position = parseInt(options.position);
            }

            Jaxon.UiPreset.save( position );
            Jaxon.Presets.saveToDisk();
            
            return createMsg ( true, "Done" );
        }

        WidgetCreator.overwritePreset = function( key, val, options ) {
            // Save SUI data
            WidgetCreator.saveUiPreset();

            Jaxon.UiPreset.setProp( key, val );

            // Process Options
            var index = -1;
            if(options && options.hasOwnProperty('position')) {
                index = parseInt(options.position);
            } else {
                index = Jaxon.Presets.getIndex( key, val );
            }

            Jaxon.Presets.addUnique( Jaxon.UiPreset.get(), key, {position: index, silently: true} );
            Jaxon.Presets.saveToDisk();
            return createMsg ( true, "Done" );
        }

        WidgetCreator.saveLastUsed = function() {
            try {
                var originalName = Jaxon.UiPreset.get()[listKey];
                WidgetCreator.overwritePreset( listKey, lastUsedPresetName, {position: -1} );
                Jaxon.UiPreset.setProp( listKey, originalName );
            } catch ( err ) {
                alert(err)
            }
            return Jaxon.UiPreset.get();
        }

        WidgetCreator.reset = function() {
            return createMsg( false, "Widget is not loaded.");
        }

        WidgetCreator.loadIndex = function( i ) {
            // Load data in UiPreset
            Jaxon.UiPreset.loadIndex( i );
            // Update SUI
            DataPort.renderUiPreset();
            presetsDrop.selection = getDropDownIndex( i+1, presetDropList.length );
            return true;
        }

        WidgetCreator.attachTo = function ( SUI_Group, listKeyID, Port, Options ) {
            var onloadIndex = null;
            listKey = String(listKeyID);

            if(! (Port && Port.hasOwnProperty('renderData') && Port.hasOwnProperty('getData')) ) {
                return createMsg( false, "Could not establish data port.");
            }
            DataPort.renderUiPreset = function () {
                basedOnPresetName = String( Jaxon.UiPreset.getProp(listKey) );
                Port.renderData( Jaxon.UiPreset.get() );
            }
            DataPort.getData = Port.getData;

            // Process Options
            if(Options && Options.hasOwnProperty('onloadIndex')) {
                onloadIndex = parseInt(Options.onloadIndex);
            }
            if(Options && Options.hasOwnProperty('lockChars')) {
                if(lockChars.length == 2) {
                    lockChars[0] = String(Options.lockChars[0]);
                    lockChars[1] = String(Options.lockChars[1]);
                }
            }
            if(Options && Options.hasOwnProperty('newPresetName')) {
                newName = String(Options.newPresetName);
            }
            if(Options && Options.hasOwnProperty('lastUsedPresetName')) {
                lastUsedName = String(Options.lastUsedPresetName);
            }
            if(Options && Options.hasOwnProperty('buttonTextSave')) {
                ButtonText.save  = String(Options.buttonTextSave);
            }
            if(Options && Options.hasOwnProperty('buttonTextClear')) {
                ButtonText.clear = String(Options.buttonTextClear);
            }

            function updatePresetData() {
                // Update newPresetName
                updatePresetNames();
                createDropDownList( listKey );
            }

            updatePresetData();

            // Attach new widget to SUI_Group
            presetsDrop = SUI_Group.add('dropdownlist', undefined, presetDropList);
            presetsDrop.alignment = 'fill';
            presetsDrop.selection = getDropDownIndex( onloadIndex, presetDropList.length );

            presetsDrop.onChange = function () { 
                if(updateUI) {
                    // Load data in UiPreset
                    if(this.selection.index == 0) {
                        Jaxon.UiPreset.reset();
                    } else {
                        Jaxon.UiPreset.loadIndex( this.selection.index-1 );
                    }
                    DataPort.renderUiPreset();
                    // Update button
                    if( this.selection.text.indexOf(lockChars[0]) == 0 ){
                        presetBut.text = ButtonText.save;
                    } else {
                        presetBut.text = ButtonText.clear;
                    }
                }
            }

            WidgetCreator.updatePresetsDrop = function( selectIndex ) {
                // This function will update the drop down without updating UI input values
                updateUI = false;
                updatePresetData();
                presetsDrop.removeAll();
                var len = presetDropList.length; 
                for (var i=0; i<len; i++) {
                    presetsDrop.add('item', presetDropList[i] );
                }
                presetsDrop.selection = isNaN(selectIndex) ? 0 : calcIndex( selectIndex, len );
                updateUI = true;
                return createMsg( true, "Done");
            }

            WidgetCreator.reset = function() {
                // Update Presets Dropdown
                WidgetCreator.updatePresetsDrop();
                // Clear UI and update button states
                presetsDrop.selection = 0;
                return createMsg( true, "Done");
            }

            presetBut = SUI_Group.add('button', undefined, ButtonText.save);

            function _addUiPresetToPresets( defaultName ) {
                var defaultName = defaultName || basedOnPresetName;
                    defaultName = String( defaultName );

                var presetName = prompt("Name: ", defaultName, "Save Preset");

                if ( presetName != null ) {
                    if ( presetName.indexOf(lockChars[0]) == 0 ) {
                        alert( "You can't start a preset name with: " + lockChars[0] );
                        // Recurse
                        return _addUiPresetToPresets();
                    }
                    Jaxon.UiPreset.setProp( listKey, presetName );
                    // Add preset to end
                    Jaxon.Presets.addUnique( Jaxon.UiPreset.get(), listKey, {position:-1} );
                    WidgetCreator.reset();
                    presetsDrop.selection = presetsDrop.items.length-1;
                }
            }

            presetBut.onClick = function () { 
                if( this.text == ButtonText.clear ) {
                    Jaxon.Presets.remove( presetsDrop.selection.index - 1 );
                    WidgetCreator.reset();
                } else { // Save preset
                    Jaxon.UiPreset.load( DataPort.getData() );
                    _addUiPresetToPresets();
                }
                Jaxon.Presets.saveToDisk();
            }
            
            // Load selected dropdown
            if( isNaN(onloadIndex) ) {
                WidgetCreator.loadIndex( onloadIndex );
            } else {
                // AKA load session state
                DataPort.renderUiPreset();
            }
            return createMsg( true, "Done");
        }

    } // End Widget


    //-------------------------------------------------
    // S T A R T  P U B L I C   A P I
    //-------------------------------------------------

    Jaxon.getPresetsFilePath = function () {
        return filePath;
    }

    Jaxon.errors = function() {
        // Always return an array of errors
        if(Array.isArray(errors)) {
            return errors;
        } else {
            return [errors];
        }
    }

    // current preset (The presets we manipulate)
    // We need to buils these
    Jaxon.Presets  = new presetsController( standardPresets );
    
    // create a data controller for UiPreset
    Jaxon.UiPreset = new presetController( presetJaw.getTemplate( true ) );
    
    // create widget builder
    Jaxon.Widget = new widgetCreator();

    // Extend presetController UiPreset
    Jaxon.UiPreset.save = function( position ) {
        // position or index, negative numbers are calculated from the back -1 == last
        return Jaxon.Presets.add( Jaxon.UiPreset.get(), {position: position} );
    }

    Jaxon.UiPreset.loadIndex = function ( index ) {
        var len = Jaxon.Presets.get().length;
        var i = Math.abs(parseInt(index));
        if(i > len-1) {
            alert("Preset Manager\nLoad index is not a valid preset index: " + index);
            return createMsg ( false, "Not a valid preset index." );
        }
        Jaxon.UiPreset.load( Jaxon.Presets.getByIndex( i ) );
        return createMsg ( true, "Done" );
    }

    Jaxon.UiPreset.reset = function ( ) {
        Jaxon.UiPreset.load( presetJaw.getTemplate( true ) );
    }

    Jaxon.reset = function( hard ) {
        var hard = (hard == true);
        if( hard ) {
            Jaxon.Presets.reset();
            Jaxon.Presets.saveToDisk();
        } else {
            Jaxon.Presets.loadFromDisk();
        }
        Jaxon.UiPreset.reset();
        Jaxon.Widget.reset();
    }

    Jaxon.format = function ( preset ) {
        return updatePreset ( preset );
    }

    //-------------------------------------------------
    // E N D   P U B L I C   A P I
    //-------------------------------------------------
    
    // I N I T
    //---------    
    // Save the standard presets if not allready exist
    if(!fileExist( filePath ) ){
        if( ! Jaxon.Presets.saveToDisk() ){
            throw("Failed to start Jaxon\nUnable to save presets to " + filePath);
        }
    }
    // Load the presets
    Jaxon.Presets.loadFromDisk();
};

