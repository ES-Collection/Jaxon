#strict on
#target InDesign

var testFileName = "Jaxon_Test";

new File(app.activeScript.parent + '/make_all.sh').execute();
$.sleep( 1000 ); // Wait to make latest version of jaws.jsx

// Tests for Jaxon

/*------------------------------------------
    S E T U P
------------------------------------------*/
#include 'head.js'
#include 'console.js'

var Schema = {
  "type": "object",
  "properties": {
    "name": { "type": "string", "default": "New Preset"  },
    "bool": { "type": "boolean" },
    "arr":  { "type": "array"   },
    "obj":  { "type": "object",
      "properties": {
        "x": { "type": "number", "default": 0 },
        "y": { "type": "number", "default": 0 }
      }
    },
    "num": { "type": "number", "default": 0 }
  }
}

var testPreset01 = { name  : "Test 01",
                     bool  : true,
                     arr   : [1,2,3,4],
                     obj   : { x : 1, y : 2 },
                     num   : 1.11 };
var testPreset02 = { name  : "Test 02",
                     bool  : false,
                     arr   : [5,6,7,8],
                     obj   : { x : 10, y : 20 },
                     num   : 11.1 };
var testPreset03 = { name  : "Test 03",
                     bool  : true,
                     arr   : [9,10,11,12],
                     obj   : { x : 100, y : 200 },
                     num   : 111 };

var standardPresets = [testPreset01,testPreset02,testPreset03];

// Load a new instance of Jaxon
var Jaxon = new presetManager(testFileName, Schema, standardPresets);
Jaxon.Presets.removeFromDisk(); // Force clean

/*------------------------------------------
    T E S T S
------------------------------------------*/

var tests = {

  /*

    T E S T   P R E S E T S
    -----------------------

  */

  test_presets_get: function() {
    var myPresets = Jaxon.Presets.get();
    assert("Three presets expected", myPresets.length == 3);
    assert("Second preset name does not match", myPresets[1].name == "Test 02");
  },

  test_presets_get_by_Key: function() {
    // Test multiple keys here
    var aPreset = Jaxon.Presets.getByKey('name','Test 02');
    assert("received wrong preset", aPreset.name == 'Test 02');
  },

  test_presets_get_by_Index: function() {
    var aPreset = Jaxon.Presets.getByIndex( 1 );
    assert("Received wrong preset with positive index", aPreset.name == "Test 02");
    var aPreset = Jaxon.Presets.getByIndex( -2 );
    assert("Received wrong preset with negative index", aPreset.name == "Test 02");
  },

  test_presets_get_property_list: function() {
    var props = Jaxon.Presets.getPropList("name");
    assert("Received wrong preset with negative index", sameArrayPositions( props, ['Test 01','Test 02','Test 03'] ) );
  },

  test_presets_overwriteIndex_and_reset: function() {
    var testPreset = { name  : "Test 04"};
    Jaxon.Presets.overwriteIndex(0,testPreset);
    assert("Did not overwrite the preset", Jaxon.Presets.getByIndex( 0 ).name == "Test 04");
    
    testPreset = { name  : "Test 05"};
    Jaxon.Presets.overwriteIndex(-2,testPreset);
    assert("Did not overwrite the preset", Jaxon.Presets.getByIndex( -2 ).name == "Test 05");

    Jaxon.Presets.reset();
    assert("Did not reset", Jaxon.Presets.getByIndex( 0 ).name == "Test 01");
  },

  test_presets_load: function() {
    var testPresets = [{ name  : "Load 01"},{ name  : "Load 02"},{ name  : "Load 03"}];
    Jaxon.Presets.load(testPresets);
    assert("Did not overwrite presets", Jaxon.Presets.getByIndex( 1 ).name == "Load 02");
  },

  test_presets_add: function() {
    var testPreset04 = { name  : "[ Test 04 ]",
                         bool  : false,
                         arr   : [8,9,10,11],
                         obj   : { x : 1, y : 2 },
                         num   : 1 };
    var newPresets;

    Jaxon.Presets.add(testPreset04);
    newPresets = Jaxon.Presets.get();
    assert("Received wrong preset 1", newPresets[newPresets.length-1].name == "[ Test 04 ]");
    
    Jaxon.Presets.add(testPreset04, {position: 1});
    newPresets = Jaxon.Presets.get();
    assert("Received wrong preset 2", newPresets[1].name == "[ Test 04 ]");
    
    Jaxon.Presets.add(testPreset04, {position: -2});
    newPresets = Jaxon.Presets.get();
    assert("Received wrong preset 3", newPresets[newPresets.length-2].name == "[ Test 04 ]");

    Jaxon.Presets.add(testPreset04, {position: -1});
    newPresets = Jaxon.Presets.get();
    assert("Received wrong preset 4", newPresets[newPresets.length-1].name == "[ Test 04 ]");

  },

  test_presets_add_unique: function() {
    var notSoUniquePreset = { name  : "Test 01",
                              bool  : false,
                              arr   : [8,9,10,11],
                              obj   : { x : 1, y : 2 },
                              num   : 1 };

    Jaxon.Presets.load([testPreset01,testPreset01,testPreset02,testPreset02,testPreset03]);
    Jaxon.Presets.addUnique(notSoUniquePreset, 'name', {silently: true, position:3});
    assert("Did not remove double preset", Jaxon.Presets.get().length == 4);
    assert("Not in right position", Jaxon.Presets.getByIndex(3).name == "Test 01");
  },

  test_presets_remove: function() {
    Jaxon.Presets.remove(0);
    assert("Could not remove preset", Jaxon.Presets.getByIndex(0).name == "Test 02");
  },

  test_presets_remove_where: function() {
    Jaxon.Presets.removeWhere('bool', false);
    assert("Could not remove preset", Jaxon.Presets.get().length == 2);
    assert("Removed wrong preset", Jaxon.Presets.getByIndex(0).bool == true);
    assert("Removed wrong preset", Jaxon.Presets.getByIndex(1).bool == true);
  },

  test_presets_load_save_to_disk: function() {
    var presetsFile = File( Jaxon.getPresetsFilePath() );
    if(presetsFile.exists) {
      presetsFile.remove();
    }

    assert("Did not remove from disk", presetsFile.exists == false);

    Jaxon = new presetManager("Jaxon_Test_2", Schema, [testPreset01,testPreset01,testPreset01,testPreset01,testPreset01,testPreset01]);
    var presetsFile = File( Jaxon.getPresetsFilePath() );
    assert("File does not exist", presetsFile.exists);

    assert("Did not disk", Jaxon.Presets.get().length == 6);

    if(presetsFile.exists) {
      presetsFile.remove();
    }

    reset_testEnv( standardPresets, Schema );
    assert("Did not disk", Jaxon.Presets.get().length == 3);
  },

  /*

    T E S T  T E M P  P R E S E T
    ------------------------------
    
  */
  test_dont_save_temp_presets_to_disk: function() {
    var tempPreset = { name  : "TEMP",
                       bool  : false,
                       arr   : [8,9,10,11],
                       obj   : { x : 1, y : 2 },
                       num   : 1 };

    Jaxon.Presets.load([testPreset01,testPreset01,testPreset02,testPreset02,testPreset03]);

    Jaxon.Presets.add(tempPreset, {temporary: true});

    assert("Did not added temp preset", Jaxon.Presets.get().length == 6);
    Jaxon.Presets.saveToDisk();
    Jaxon.Presets.loadFromDisk();
    assert("Saved temp preset to disk", Jaxon.Presets.get().length == 5);
  },

  /*

    T E S T   ( U I ) P R E S E T
    ------------------------------
    
  */

  test_UiPreset_save: function() {
    Jaxon.UiPreset.save( Jaxon.Presets.getByIndex(0) );
    assert("Did not save preset in UiPreset", Jaxon.UiPreset.get().name == Jaxon.Presets.getByIndex(-1).name);
  },

  test_UiPreset_reset: function() {
    // We need to set a few things here so we can do some spot checks
    Jaxon.UiPreset.setProp('name',"New Name");
    assert("UiPreset.setProp failed", Jaxon.UiPreset.get().name == "New Name");
    var ok = Jaxon.reset();
    assert("Something went wrong resetting Jaxon", Jaxon.UiPreset.get().name == "New Preset");
  },

  test_UiPreset_loadIndex: function() {
    Jaxon.UiPreset.loadIndex( 1 );
    assert("Did not load right preset unto UiPreset", Jaxon.UiPreset.get().name == Jaxon.Presets.getByIndex(1).name );
  },

  test_UiPreset_load: function() {
    var aPreset = Jaxon.Presets.getByIndex( 2 );
    Jaxon.UiPreset.load(aPreset);
    assert("Did not load right preset unto UiPreset", Jaxon.UiPreset.get().name == Jaxon.Presets.getByIndex(2).name );
  },

  test_update_prop: function() {
    var newSchema = {
      "type": "object",
      "properties": {
        "name":    { "type": "string", "default": "[ Test New Prop ]"  },
        "bool":    { "type": "boolean" },
        "newProp": { "type": "string", "default" : "Things change..." },
        "arr":     { "type": "array"   },
        "obj":     { "type": "object",
          "properties": {
            "x": { "type": "number", "default": 0 },
            "y": { "type": "number", "default": 0 }
          }
        },
        "num": { "type": "number", "default": 0 }
      }
    };

    reset_testEnv( standardPresets, newSchema );

    var UiPreset = Jaxon.UiPreset.get();
    assert("Can't get UiPreset", UiPreset.name == "[ Test New Prop ]");

    var aPreset = Jaxon.Presets.getByKey('name', 'Test 02');
    assert("Presets properties did not updated", aPreset.newProp == "Things change...");

  },

  test_UiPreset_Get: function() {
    var UiPreset = Jaxon.UiPreset.get();
    assert("Can't get UiPreset", UiPreset.name == "New Preset");
  },

  // Tests for UiPreset
  test_Set_Get_Reset_Prop_UiPreset: function() {
    var num;
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value A", num === 0);
    Jaxon.UiPreset.setProp('num', 2);
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value B", num === 2);
    Jaxon.UiPreset.reset();
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value C", num === 0);
  },

  // Tests for UiPreset
  test_default_null_or_number: function() {
    var newSchema = {
      "type": "object",
      "properties": {
        "num": { "type": ["null", "number"]}
      }
    };

    reset_testEnv( standardPresets, newSchema );

    var num;
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value A", num === null);
    Jaxon.UiPreset.setProp('num', 2);
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value B", num === 2);
    Jaxon.UiPreset.reset();
    num = Jaxon.UiPreset.getProp('num');
    assert("Did not get correct property value C", num === null);
  },

}

/*------------------------------------------
    E N D  -  T E S T S
------------------------------------------*/

/*------------------------------------------
    H E L P E R S
------------------------------------------*/

function reset_testEnv( standardPresets, Schema ) {
  Jaxon = new presetManager(testFileName, Schema, standardPresets);
  Jaxon.reset();
}

function sameArrayPositions( arr1, arr2 ) {
  var arr1len = arr1.length-1;
  var arr2len = arr2.length-1;
  if(arr1len != arr2len) return false;

  for(var i = 0; i < arr1len; i++) {
        if(arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function assert(msg, success) {
  if (!success) {
    throw msg;
  }
}

function clearConsole(){
  var bt = new BridgeTalk();
  bt.target = 'estoolkit';
  bt.body = function(){
    app.clc();
  }.toSource()+"()";
  bt.send(5);
}

function runTests(){
  console.clear();

  var result = "Pass";
  for (var test in tests) {
    try {
        reset_testEnv( standardPresets, Schema );
        tests[test]();
        console.log('OK: ' + test);
    } catch (e) {
        result = "Fail";
        console.log(test + " failed: " + e.description + "(Line " + e.line + " in file " + e.fileName + ")");
    }
  }
  return result;
}

alert( runTests() );

//EOF
