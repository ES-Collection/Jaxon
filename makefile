.PHONY: dependent standalone all

standalone: src/head.js src/es-polyfill.js src/jaw.js src/preset-manager.js 
	$(shell sed '/#include/d' $^ > jaxon.jsxinc)

dependent: src/head.js src/preset-manager.js
	$(shell sed '/#include/d' $^ > jaxon.js)

all: dependent standalone
