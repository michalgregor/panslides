/*****************************************************************
** Author: Michal Gregor, michal@gregor.sk
**
** A plugin that introduces css with special styling commands
** such as .block .subtitle or .spread05.
**
** Version: 0.1
** 
** License: MIT license (see LICENSE.md)
**
******************************************************************/

var RevealStylingCommands = window.RevealStylingCommands || (function(){
	// modified from menu plugin
	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -19);
		} else {
			var sel = document.querySelector('script[src$="styling_commands.js"]');
			if (sel) {
				path = sel.src.slice(0, -19);
			}
		}
		return path;
	}

	// from menu plugin
	function loadResource( url, type, callback ) {
		var head = document.querySelector( 'head' );
		var resource;

		if ( type === 'script' ) {
			resource = document.createElement( 'script' );
			resource.type = 'text/javascript';
			resource.src = url;
		}
		else if ( type === 'stylesheet' ) {
			resource = document.createElement( 'link' );
			resource.rel = 'stylesheet';
			resource.href = url;
		}

		// Wrapper for callback to make sure it only fires once
		var finish = function() {
			if( typeof callback === 'function' ) {
				callback.call();
				callback = null;
			}
		}

		resource.onload = finish;

		// IE
		resource.onreadystatechange = function() {
			if ( this.readyState === 'loaded' ) {
				finish();
			}
		}

		// Normal browsers
		head.appendChild( resource );
	}

	var config = Reveal.getConfig().overlays || {};
	config.path = config.path || scriptPath() || 'plugin/styling_commands/';
	loadResource(config.path + 'styling_commands.css', 'stylesheet');

	return this;
})();
