/*****************************************************************
** Author: Michal Gregor, michal@gregor.sk
**
** A plugin that allows latex-like range-based only and onslide overlays
** in addition to standard fragments.
**
** Version: 0.1
** 
** License: MIT license (see LICENSE.md)
**
******************************************************************/

var RevealOverlays = window.RevealOverlays || (function(){
	// modified from menu plugin
	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -11);
		} else {
			var sel = document.querySelector('script[src$="overlays.js"]');
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
	config.path = config.path || scriptPath() || 'plugin/overlays/';
	loadResource(config.path + 'overlays.css', 'stylesheet');

	return this;
})();

function ov_toArray( o ) {
	return Array.prototype.slice.call( o );
}

function ov_replace_autoplay(element) {
	var replace_func = 	function(elem) {
		elem.removeAttribute("data-autoplay");
		elem.setAttribute("data-overlay-autoplay", "true");
	}

	overlays = collect_overlays(element)[0];
	overlays.forEach(function(item){
		element = item[0];
		// HTML5 media elements
		ov_toArray( element.querySelectorAll( 'video[data-autoplay], audio[data-autoplay]' ) ).forEach(replace_func);
		// Generic postMessage API for non-lazy loaded iframes
		ov_toArray( element.querySelectorAll( 'iframe[data-autoplay]' ) ).forEach(replace_func);
	});
}

/**
 * Starts playing an embedded video/audio element after
 * it has finished loading.
 *
 * @param {object} event
 */
function ov_startEmbeddedMedia( event ) {

	var isAttachedToDOM = !!event.target.closest( 'html' ),
		isVisible  		= !!event.target.closest( '.present' );

	if( isAttachedToDOM && isVisible ) {
		event.target.currentTime = 0;
		event.target.play();
	}

	event.target.removeEventListener( 'loadeddata', ov_startEmbeddedMedia );

}

/**
 * "Starts" the content of an embedded iframe using the
 * postMessage API.
 *
 * @param {object} event
 */
function ov_startEmbeddedIframe( event ) {

	var iframe = event.target;

	if( iframe && iframe.contentWindow ) {

		var isAttachedToDOM = !!event.target.closest( 'html' ),
			isVisible  		= !!event.target.closest( '.present' );

		if( isAttachedToDOM && isVisible ) {

			// Prefer an explicit global autoplay setting
			var autoplay = Reveal.getConfig().autoPlayMedia;

			// If no global setting is available, fall back on the element's
			// own autoplay setting
			if( typeof autoplay !== 'boolean' ) {
				autoplay = iframe.hasAttribute( 'data-autoplay' ) || !!iframe.closest( '.slide-background' );
			}

			// YouTube postMessage API
			if( /youtube\.com\/embed\//.test( iframe.getAttribute( 'src' ) ) && autoplay ) {
				iframe.contentWindow.postMessage( '{"event":"command","func":"playVideo","args":""}', '*' );
			}
			// Vimeo postMessage API
			else if( /player\.vimeo\.com\//.test( iframe.getAttribute( 'src' ) ) && autoplay ) {
				iframe.contentWindow.postMessage( '{"method":"play"}', '*' );
			}
			// Generic postMessage API
			else {
				iframe.contentWindow.postMessage( 'slide:start', '*' );
			}

		}

	}

}

/**
 * Start playback of any embedded content inside of
 * the given element.
 *
 * @param {HTMLElement} element
 */
function ov_startEmbeddedContent( element ) {
	if( element && !Reveal.isSpeakerNotes() ) {
		// Restart GIFs
		ov_toArray( element.querySelectorAll( 'img[src$=".gif"]' ) ).forEach( function( el ) {
			// Setting the same unchanged source like this was confirmed
			// to work in Chrome, FF & Safari
			el.setAttribute( 'src', el.getAttribute( 'src' ) );
		} );

		// HTML5 media elements
		ov_toArray( element.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
		    // if this is inside a hidden overlay, don't start playback
			if( el.closest(".overlay-hidden") != null ) {
				return;
			}

			// Prefer an explicit global autoplay setting
			var autoplay = Reveal.getConfig().autoPlayMedia;

			// If no global setting is available, fall back on the element's
			// own autoplay setting
			if( typeof autoplay !== 'boolean' ) {
				autoplay = el.hasAttribute( 'data-overlay-autoplay' ) || !!el.closest( '.slide-background' );
			}

			if( autoplay && typeof el.play === 'function' ) {

				// If the media is ready, start playback
				if( el.readyState > 1 ) {
					ov_startEmbeddedMedia( { target: el } );
				}
				// Mobile devices never fire a loaded event so instead
				// of waiting, we initiate playback
				else if( Reveal.isMobileDevice ) {
					var promise = el.play();

					// If autoplay does not work, ensure that the controls are visible so
					// that the viewer can start the media on their own
					if( promise && typeof promise.catch === 'function' && el.controls === false ) {
						promise.catch( function() {
							el.controls = true;

							// Once the video does start playing, hide the controls again
							el.addEventListener( 'play', function() {
								el.controls = false;
							} );
						} );
					}
				}
				// If the media isn't loaded, wait before playing
				else {
					el.removeEventListener( 'loadeddata', ov_startEmbeddedMedia ); // remove first to avoid dupes
					el.addEventListener( 'loadeddata', ov_startEmbeddedMedia );
				}

			}
		} );

		// Normal iframes
		ov_toArray( element.querySelectorAll( 'iframe[src]' ) ).forEach( function( el ) {
			if( el.closest( '.fragment' ) && !el.closest( '.fragment.visible' ) ) {
				return;
			}

			ov_startEmbeddedIframe( { target: el } );
		} );

		// Lazy loading iframes
		ov_toArray( element.querySelectorAll( 'iframe[data-src]' ) ).forEach( function( el ) {
			if( el.closest( '.fragment' ) && !el.closest( '.fragment.visible' ) ) {
				return;
			}

			if( el.getAttribute( 'src' ) !== el.getAttribute( 'data-src' ) ) {
				el.removeEventListener( 'load', ov_startEmbeddedIframe ); // remove first to avoid dupes
				el.addEventListener( 'load', ov_startEmbeddedIframe );
				el.setAttribute( 'src', el.getAttribute( 'data-src' ) );
			}
		} );

	}

}

/**
 * Stop playback of any embedded content inside of
 * the targeted slide.
 *
 * @param {HTMLElement} element
 */
function ov_stopEmbeddedContent( element ) {

	if( element && element.parentNode ) {
		// HTML5 media elements
		ov_toArray( element.querySelectorAll( 'video, audio' ) ).forEach( function( el ) {
			if( !el.hasAttribute( 'data-ignore' ) && typeof el.pause === 'function' ) {
				el.setAttribute('data-paused-by-reveal', '');
				el.pause();
			}
		} );

		// Generic postMessage API for non-lazy loaded iframes
		ov_toArray( element.querySelectorAll( 'iframe' ) ).forEach( function( el ) {
			if( el.contentWindow ) el.contentWindow.postMessage( 'slide:stop', '*' );
			el.removeEventListener( 'load', ov_startEmbeddedIframe );
		});

		// YouTube postMessage API
		ov_toArray( element.querySelectorAll( 'iframe[src*="youtube.com/embed/"]' ) ).forEach( function( el ) {
			if( !el.hasAttribute( 'data-ignore' ) && el.contentWindow && typeof el.contentWindow.postMessage === 'function' ) {
				el.contentWindow.postMessage( '{"event":"command","func":"pauseVideo","args":""}', '*' );
			}
		});

		// Vimeo postMessage API
		ov_toArray( element.querySelectorAll( 'iframe[src*="player.vimeo.com/"]' ) ).forEach( function( el ) {
			if( !el.hasAttribute( 'data-ignore' ) && el.contentWindow && typeof el.contentWindow.postMessage === 'function' ) {
				el.contentWindow.postMessage( '{"method":"pause"}', '*' );
			}
		});
	}

}

function collect_overlays(element) {
	attributes = ["only", "onslide"];
	var overlays = [];
	var max_step = 0;

	for (iattr=0; iattr<attributes.length; iattr++) {
		var with_attr = element.querySelectorAll("[data-" + attributes[iattr] + "]");

		for(i = 0; i < with_attr.length; i++) {
			var parts = with_attr[i].getAttribute("data-" + attributes[iattr]).split("-");

			if (parts.length == 1) {
				var from = parseInt(parts[0]);
				if (isNaN(15)) continue;
				from = Math.max(from, 1);
				max_step = Math.max(max_step, from);
				overlays.push([with_attr[i], attributes[iattr], from, from+1]);
			} else if (parts.length == 2) {
				var from = parseInt(parts[0]);
				if (isNaN(from)) continue;
				from = Math.max(from, 1);

				var to;
				// if empty, keep displayed until the end
				if (parts[1].trim().length == 0) {
					to = NaN;
					max_step = Math.max(max_step, from);
				} else {			
					to = parseInt(parts[1]);
					if (isNaN(to)) continue;
					to = Math.max(to, 1);

					if (from > to) {
						var tmp = from;
						from = to;
						to = tmp;
					}

					max_step = Math.max(max_step, to);
				}

				overlays.push([with_attr[i], attributes[iattr], from, to+1]);
			}
		}
	}

	return [overlays, max_step];
}

function ensure_array(obj) {
	if(obj === null ||
	   typeof obj === 'undefined' || (
	   typeof obj === 'string' && obj.length == 0)) obj = [];
	else if (!Array.isArray(obj)) obj = [obj];
	return obj;
}

function run_func(func) {
	if(typeof func === 'string') {
		let currentSlide = Reveal.getCurrentSlide();
		return eval(func);
	} else {
		return func();
	}
}

function arar_resize(arr, size) {
	var delta = arr.length - size;

	if (delta > 0) {
		arr.length = size;
	}
	else {
		while (delta++ < 0) { arr.push([]); }
	}
}

function fragments_by_step(slide) {
	var fragments = Reveal.syncFragments(slide);
	var by_step = [];
	
	for(i=0; i < fragments.length; i++) {
		fragments[i].onshow = ensure_array(fragments[i].getAttribute("data-onshow"));
		fragments[i].onhide = ensure_array(fragments[i].getAttribute("data-onhide"));
		var index = parseInt(fragments[i].getAttribute("data-absolute-index")) - 1;
		if (isNaN(index)) index = parseInt(fragments[i].getAttribute("data-fragment-index"));
		arar_resize(by_step, Math.max(index+1, by_step.length));
		fragments[i].setAttribute("data-fragment-index", index);
		by_step[index].push(fragments[i]);
	}

	return by_step;
}

function process_slide_overlays(slide) {
		// disable autoplay for overlays
		ov_replace_autoplay(slide);

		slide.onshow = [];
		var ret = collect_overlays(slide);
		slide.overlays = ret[0];
		slide.overlays_max_step = ret[1];
		var by_step = fragments_by_step(slide);
		arar_resize(by_step, Math.max(by_step.length, slide.overlays_max_step-1));

		for (i=0; i<by_step.length; i++) {
			if (by_step[i].length == 0) {
				var frag = document.createElement("span");
				frag.classList.add("fragment");
				frag.setAttribute("data-fragment-index", i);
				frag.onshow = [];
				frag.onhide = [];
				by_step[i].push(frag);
				slide.appendChild(frag);
			}
		}

		add_overlays(slide, by_step, slide.overlays);
}

function add_overlays(slide, by_step, overlays) {
	for (i=0; i<overlays.length; i++) {
		let elem = overlays[i][0];
		var attr = overlays[i][1];
		var from = overlays[i][2];
		var to = overlays[i][3];
		if (isNaN(to)) to = by_step.length+2;

		elem.classList.add('overlay-hidden');

		if(attr == "only") {
			elem.classList.add('only-hidden');
			elem.classList.add('only-hidden-transition');

			show_func = function(){
				elem.classList.remove('overlay-hidden');
				elem.classList.remove('only-hidden');
				elem.offsetLeft;
				elem.classList.remove('only-hidden-transition');
				ov_startEmbeddedContent(elem);
			};

			hide_func = function(){
				elem.classList.add('overlay-hidden');
				elem.classList.add('only-hidden');
				elem.classList.add('only-hidden-transition');
				ov_stopEmbeddedContent(elem);
			};
		} else if(attr == "onslide") {
			elem.classList.add('onslide-hidden');

			show_func = function(){
				elem.classList.remove('onslide-hidden');
				elem.classList.remove('overlay-hidden');
				ov_startEmbeddedContent(elem);
			};

			hide_func = function(){
				elem.classList.add('onslide-hidden');
				elem.classList.add('overlay-hidden');
				ov_stopEmbeddedContent(elem);
			};
		} else continue;

		if ((from-2 >= 0) && (from-2 < by_step.length)) {
			by_step[from-2][0].onshow.push(show_func);
			if (elem.hasAttribute("data-onshow"))
				by_step[from-2][0].onshow.push(elem.getAttribute("data-onshow"));

			by_step[from-2][0].onhide.push(hide_func);
			if (elem.hasAttribute("data-onhide"))
				by_step[from-2][0].onhide.push(elem.getAttribute("data-onhide"));
		} else {
			slide.onshow.push(show_func);
			if (elem.hasAttribute("data-onshow"))
				slide.onshow.push(elem.getAttribute("data-onshow"));
		}

		if ((to-2 >= 0) && (to-2 < by_step.length)) {
			by_step[to-2][0].onshow.push(hide_func);
			if (elem.hasAttribute("data-onhide"))
				by_step[to-2][0].onshow.push(elem.getAttribute("data-onhide"));

			by_step[to-2][0].onhide.push(show_func);
			if (elem.hasAttribute("data-onshow"))
				by_step[to-2][0].onhide.push(elem.getAttribute("data-onshow"));
		}
	}
}

// if there are any visible fragments, go over them and 
// and run their onshow callbacks
function animate_visible(slide) {
	frags = Reveal.syncFragments(slide);
	slide.onshow.forEach(run_func);
	
	for(i=0; i<frags.length; i++) {
		if (frags[i].classList.contains("visible")) {
			frags[i].onshow.forEach(run_func);
		} else break;
	}
}

if(document.readyState === "loading") {
	document.addEventListener('DOMContentLoaded', () => {
		slides = document.querySelectorAll("section");
		slides.forEach(process_slide_overlays);
	});
} else {
	slides = document.querySelectorAll("section");
	slides.forEach(process_slide_overlays);
}

Reveal.addEventListener( 'fragmentshown', function( event ) {
	event.fragment.onshow.forEach(run_func);
	ov_startEmbeddedContent(event.fragment);
} );

Reveal.addEventListener( 'fragmenthidden', function( event ) {
	event.fragment.onhide.forEach(run_func);
	ov_stopEmbeddedContent(event.fragment);
});

Reveal.addEventListener( 'slidechanged', function( event ) {
	animate_visible(event.currentSlide);
	ov_stopEmbeddedContent(event.previousSlide);
	ov_startEmbeddedContent(event.currentSlide);
} );

Reveal.addEventListener( 'ready', function( event ) {
	animate_visible(event.currentSlide);
	ov_startEmbeddedContent(event.currentSlide);
} );

// make sure that everything is animated correctly in the PDF view
Reveal.addEventListener( 'pdf-ready', function( event ) {
	slides = document.querySelectorAll("section");
	slides.forEach(function(slide){
		process_slide_overlays(slide);
		animate_visible(slide);
	});
} );
