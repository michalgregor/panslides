/*****************************************************************
** Author: Michal Gregor, michal@gregor.sk
**
** A plugin containing convenience scripts for controlling matplotlib
** animations rendered in HTML form.
**
** Version: 0.1
** 
** License: MIT license (see LICENSE.md)
**
******************************************************************/

var RevealPltAnim = window.RevealPltAnim || (function(){
	// modified from menu plugin
	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -11);
		} else {
			var sel = document.querySelector('script[src$="plt_anim.js"]');
			if (sel) {
				path = sel.src.slice(0, -11);
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
	config.path = config.path || scriptPath() || 'plugin/plt_anim/';
	loadResource(config.path + 'plt_anim.css', 'stylesheet');

	return this;
})();

function get_animation(slide, id) {
	var ani_wrapper = document.getElementById(id);
	ani_id = ani_wrapper.querySelector("img").getAttribute("id");
	ani_id = "anim" + ani_id.slice(9, ani_id.length);
	var ani = eval(ani_id);
	return ani;
}

function get_animation_img(slide, id) {
	var ani_wrapper = document.getElementById(id);
	return ani_wrapper.querySelector("img");
}