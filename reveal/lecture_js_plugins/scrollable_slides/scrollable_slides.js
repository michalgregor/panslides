
var RevealScrollableSlides = window.RevealScrollableSlides || (function(){
	// modified from menu plugin
	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -20);
		} else {
			var sel = document.querySelector('script[src$="scrollable_slides.js"]');
			if (sel) {
				path = sel.src.slice(0, -20);
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
	config.path = config.path || scriptPath() || 'plugin/scrollable_slides/';
    loadResource(config.path + 'scrollable_slides.css', 'stylesheet');
    
	return this;
})();

function resetSlideScrolling(slide) {
    slide.classList.remove('scrollable-slide');
}

function handleSlideScrolling(slide) {
    if (slide.scrollHeight >= 800 &&
        !slide.classList.contains("unscrollable-slide")
    ) {
        slide.classList.add('scrollable-slide');
    }
}

Reveal.addEventListener('ready', function (event) {
    handleSlideScrolling(event.currentSlide);
});

Reveal.addEventListener('slidechanged', function (event) {
    if (event.previousSlide) {
        resetSlideScrolling(event.previousSlide);
    }
    handleSlideScrolling(event.currentSlide);
});