#target InDesign

/*------------------------------------------
    S E T U P
------------------------------------------*/
#include 'jaxon.jsxinc'

var schema = {
    "type": "object",
    "properties": {
        "name":    { "type": "string", "default": "New Preset" },
        "bool":    { "type": ["null", "boolean"] },
        "obj":     { "type": "object",
            "properties": {
                "x": { "type": "number", "default": 0 },
                "y": { "type": "number", "default": 0 }
            }
        }
    }
};

var standardPresets = [
    { name : "Preset 01" , bool : true  , obj : { x :   1, y :   2 } },
    { name : "Preset 02" , bool : false , obj : { x :  30, y :  40 } },
    { name : "Preset 03" , bool : true  , obj : { x : 507, y : 680 } }];

/*------------------------------------------
    Load Jaxon
------------------------------------------*/
var Pm = new presetManager( "Jaxon_Sample.json", schema, standardPresets );

/*------------------------------------------
    Build SUI
------------------------------------------*/
var ui = new Window('dialog', 'Jaxon Sample');
    ui.orientation = 'column';
    ui.alignChildren = 'left';
    ui.margins = [15,10,15,15];

// UI order
var presetPanel = ui.add('group');
var inputGroup  = ui.add('group');
    inputGroup.margins = [5,15,5,15];
var buttonGroup = ui.add('group');

// Data elements
var boolCheck = inputGroup.add("checkbox");
    boolCheck.onClick = function() {
        // Process input here if necessary 
        Pm.Widget.activateNew();
    }

inputGroup.add('statictext' , undefined, "x:");
var xInput    = inputGroup.add('edittext'   , undefined, "0");
    xInput.characters = 4;
    xInput.onChange = function() {
        // Process input here if necessary 
        Pm.Widget.activateNew();
    }

inputGroup.add('statictext' , undefined, "y:");
var yInput = inputGroup.add('edittext'   , undefined, "0");
    yInput.characters = 4;
    yInput.onChange = function() {
        // Process input here if necessary 
        Pm.Widget.activateNew();
    }

/*------------------------------------------
    Build DataPort functions
------------------------------------------*/
function getData() {
    // This function returns all UI data
    return { bool  : boolCheck.value,
             obj   : { x : parseFloat(xInput.text), y : parseFloat(yInput.text) } };
}

function renderData( data ) {
    boolCheck.value = data.bool;
    xInput.text     = data.obj.x;
    yInput.text     = data.obj.y;
}

/*------------------------------------------
    Attach Widget to presetPanel
------------------------------------------*/
Pm.Widget.attachTo( presetPanel, "name", {getData:getData,renderData:renderData});

// Add buttons
var resetBut = buttonGroup.add('button', undefined, 'Reset', {name: 'reset'});

resetBut.onClick = function () {
    Pm.reset( true ); // Hard reset
}

buttonGroup.add('button', undefined, 'Cancel', {name: 'cancel' });
buttonGroup.add('button', undefined, 'OK'    , {name: 'ok'     });

/*------------------------------------------
    Save SUI data into Presets
------------------------------------------*/
var result = ui.show();
if( result == 1) {
    // Save and return 'last used' setting
    var userSetting = Pm.Widget.saveLastUsed();
    alert( "The users settings:\n" + JSON.stringify( userSetting ));
}

