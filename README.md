ESPM  
====
ExtendScript Preset Manager (ESPM) is a preset manager for `ExtendScript`. This manager makes it easy to load and save presets to the user data-folder in JSON format.


Usage
-----

1. Include `presetManager.js` into your script by using the preprocessor directive:
    
    #include presetManager.js

2. Create a new Preset Manager with your presets:

    var Pm = new presetManager( "file_name.json", presets );

3. Create `get()` and `set()` functions that move data in and out of your interface and attach them to your `DataPort`

    var myDataPort = { getData: get, renderData: set }

4. Now attach the widget to your interface:

    Pm.Widget.attachTo( Window, KeyID, myDataPort );

Review the Wiki for [API overview](https://github.com/GitBruno/ESPM/wiki/API). Also look at [`sample_sui.jsx`](https://github.com/GitBruno/ESPM/blob/master/sample_sui.jsx) for a complete setup.


Dependencies
------------
ExtendScript does not include a JSON implementation natively so this manager will load it for you. 
ESPM will not override any existing JSON object so you can roll your own too.


Requests
--------

Bugs and feature requests are tracked with [the github issue tracker](https://github.com/GitBruno/ESPM/issues).  


Licence
---------
MIT license (MIT)
