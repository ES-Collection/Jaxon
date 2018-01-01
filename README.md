Jaxon 
=====

Jaxon is an ExtendScript Preset Manager that uses  [JSON-schemas](http://json-schema.org/) to keep presets validated. It also makes it easy to load and save presets to the user data-folder in JSON format.


Usage
-----

1. Include `jaxon.jsxinc` into your script using the preprocessor directive:
   
    `#include jaxon.jsxinc`

2. Create a new Preset Manager with your JSON-Schema:

    `var Jaxon = new presetManager( "file_name.json", Schema);`

3. Create `get()` and `set()` functions that move data in and out of your interface and attach them to your `DataPort`

    `var myDataPort = { getData: get, renderData: set }`

4. Now attach the widget to your interface:

    `Jaxon.Widget.attachTo( Window, KeyID, myDataPort );`


Resources
---------
- [Wiki](https://github.com/GitBruno/Jaxon/wiki/Home): API overview
- [JSONSchema](https://jsonschema.net): Quick schema generation
- [Sample](https://github.com/GitBruno/Jaxon/blob/master/sample_sui.jsx): Implementation sample

Dependencies
------------
All dependencies and polyfills are included. You can exclude them by running `make dependent` this will exclude the following dependencies:

- [Jaw (dependent)](https://github.com/GitBruno/Jaw)
- [JSON Schema Instantiator](https://github.com/tomarad/JSON-Schema-Instantiator)
- [JSON Schema validator](https://github.com/iclanzan/jassi)
- [Object Manager](https://github.com/dimik/object-manager)
- [ES Polyfill](https://github.com/GitBruno/Jaw/blob/master/src/es-polyfill.js)


Requests
--------

Bugs and feature requests are tracked with [the github issue tracker](https://github.com/GitBruno/Jaxon/issues). Pull requests are welcome! 


Licence
---------
MIT license (MIT)
