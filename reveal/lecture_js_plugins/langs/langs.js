/*****************************************************************
** Author: Michal Gregor, michal@gregor.sk
**
** A plugin that allows switching languages for the content
** using css and a control bar select tag.
**
** Version: 0.1
** 
** License: MIT license (see LICENSE.md)
**
******************************************************************/

var RevealLangs = window.RevealLangs || (function(){
	// detects whether running in speaker notes mode
	in_speaker_notes = (
		Reveal.isSpeakerNotes() &&
		window.location.search.endsWith('controls=false')
	)

	// parse get arguments to get the language
	var GET = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&#]*)/gi,
		function(a, name, value){GET[name]=value;}
	);

	// from menu plugin
	function create(tagName, attrs, content) {
		var el = document.createElement(tagName);
		if (attrs) {
			Object.getOwnPropertyNames(attrs).forEach(function(n) {
				el.setAttribute(n, attrs[n]);
			});
		}
		if (content) el.innerHTML = content;
		return el;
	}

	// modified from menu plugin
	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -8);
		} else {
			var sel = document.querySelector('script[src$="langs.js"]');
			if (sel) {
				path = sel.src.slice(0, -8);
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

	function createClass(name,rules){
		var style = document.createElement('style');
		style.type = 'text/css';
		document.getElementsByTagName('head')[0].appendChild(style);
		if(!(style.sheet||{}).insertRule) 
			(style.styleSheet || style.sheet).addRule(name, rules);
		else
			style.sheet.insertRule(name+"{"+rules+"}",0);
	}

	var config = Reveal.getConfig().langs || 
		{
			langs : 'en:English'
		};

	config.path = config.path || scriptPath() || 'plugin/langs/';
	loadResource(config.path + 'langs.css', 'stylesheet');

	// parse the list of languages and create a corresponding select
	var lang_array = config.langs.split(',')

	if(lang_array.length > 1) {
		// add the control elements
		var reveal = document.querySelector('.reveal');
		var langswitch = create('div', {
			'id': 'langswitch',
			'style': in_speaker_notes ? 'display: none' : ''
		});
		reveal.appendChild(langswitch);

		var label = create('label', {'for': 'language'});
		langswitch.appendChild(label);
		var select = create('select', {
			'id': 'language',
			'name': 'lang',
			'onchange': 'onLanguageSelect();'
		});
		langswitch.appendChild(select);
		get_lang = GET['lang'];

		for(var i=0; i < lang_array.length; i++) {
			lang_info = lang_array[i].split(':')
			if(lang_info.length == 1) {
				lang_id = lang_name = lang_info[0];
			} else if(lang_info.length == 2) {
				lang_id = lang_info[0];
				lang_name = lang_info[1];
			} else {
				throw "Wrong language specification: '" + lang_array[i] + "'."
			}

			// create a class that hides the language items
			// unless the language is selected
			createClass('.' + lang_id, "display: none;");
			// create a corresponding select option
			if(lang_id == get_lang)
				var opt = create('option', {
					'value': lang_id, 'selected': 'selected'
				}, lang_name);
			else
				var opt = create('option', {'value': lang_id}, lang_name);
			select.appendChild(opt);
		}
	}

	return this;
})();

// the language switching code
var language_select = document.getElementById("language");

if(language_select) {
	function langUpdateURLParameter(url, param, paramVal) {
        var TheAnchor = null;
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";

        if (additionalURL) {
            var tmpAnchor = additionalURL.split("#");
            var TheParams = tmpAnchor[0];
                TheAnchor = tmpAnchor[1];
            if(TheAnchor)
                additionalURL = TheParams;

            tempArray = additionalURL.split("&");

            for (var i=0; i<tempArray.length; i++)
            {
                if(tempArray[i].split('=')[0] != param)
                {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }        
        }
        else {
            var tmpAnchor = baseURL.split("#");
            var TheParams = tmpAnchor[0];
                TheAnchor  = tmpAnchor[1];

            if(TheParams)
                baseURL = TheParams;
        }

        if(TheAnchor)
            paramVal += "#" + TheAnchor;

        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }

	var orig_lang = language_select.value;

	function hideLanguage(lang) {
		var elements = document.getElementsByClassName(lang);
		for(var i=0; i < elements.length; i++) {
			elements[i].className = elements[i].className.replace(" visiblelang", "");
		}
	}

	function showLanguage(lang) {
		var elements = document.getElementsByClassName(lang);
		for(var i=0; i < elements.length; i++) {
			elements[i].className += " visiblelang";
		}
	}

	showLanguage(orig_lang);
	function onLanguageSelect() {
		var lang = document.getElementById("language").value;
		if(lang != orig_lang) {
			hideLanguage(orig_lang);
			showLanguage(lang);
			orig_lang = lang;
			var pageUrl = langUpdateURLParameter(window.location.href, 'lang', lang);
			window.history.replaceState('', '', pageUrl);
			window.location.href = pageUrl;
		}
	}
}
