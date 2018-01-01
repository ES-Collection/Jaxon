.PHONY: dependent standalone all

standalone: src/head.js src/es-polyfill.js src/json-initiator.js src/json-validator.js src/object-manager.js src/jaw.js src/preset-manager.js 
	$(shell sed '/#include/d' $^ > jaxon.jsxinc)

dependent: src/head.js src/preset-manager.js
	$(shell sed '/#include/d' $^ > jaxon.js)

all: dependent standalone
