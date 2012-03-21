/**
 * PrimeFaces Extensions CodeMirror Widget
 * 
 * @author Thomas Andraschko
 */
PrimeFacesExt.widget.CodeMirror = PrimeFaces.widget.BaseWidget.extend({
	
	/**
	 * Initializes the widget.
	 * 
	 * @param {object} cfg The widget configuration.
	 */
	init : function(cfg) {
		this._super(cfg);

		this.form = this.jq.closest("form");
		this.formId = this.form[0].id;
	
		//remove old instance if available
		if (this.jq.next().hasClass('CodeMirror')) {
			this.jq.next().remove();
		}
	
		this.options = this.cfg;
	
		this.options.onFocus = $.proxy(function() { this.fireEvent('focus'); }, this);
		this.options.onBlur = $.proxy(function() { this.fireEvent('blur'); }, this);
	
		this.options.onHighlightComplete =
			$.proxy(function(codeMirror) { this.fireEvent('highlightComplete'); }, this);
	
		this.options.onChange =
			$.proxy(function(from, to, text, next) {
				//set value to textarea
				this.instance.save();
				
				//fire event
				this.fireEvent('change'); 
			}, this);
	
		this.instance = CodeMirror.fromTextArea(this.jq[0], this.options);

		this.instance.widgetInstance = this;
	},

	complete : function() {
	    this.suggestions = null;
	    this.token = null;

	    // Find the token at the cursor
	    var cursor = this.instance.getCursor();
	    var token = this.instance.getTokenAt(cursor);
	    var tokenProperty = token;

	    // If it's not a 'word-style' token, ignore the token.
	    if (!/^[\w$_]*$/.test(token.string)) {
	      token = tokenProperty = {
	    		  start: cursor.ch,
	    		  end: cursor.ch,
	    		  string: "",
	    		  state: token.state,
	    		  className: token.string == "." ? "property" : null};
	    }

	    // If it is a property, find out what it is a property of.
	    while (tokenProperty.className == "property") {
	    	tokenProperty = this.instance.getTokenAt({ line: cursor.line, ch: tokenProperty.start });
	    	
	    	if (tokenProperty.string != ".") {
	    		return;
	    	}

	    	tokenProperty = this.instance.getTokenAt({ line: cursor.line, ch: tokenProperty.start });

	    	if (!context) {
	    		var context = [];
	    	}

	    	context.push(tokenProperty);
	    }
	    
	    var contextString = null;
	    if (context) {
	    	contextString = '';

	    	for (var i = 0; i < context.length; i++) {
	    		var currentContext = context[i];

	    		if (i > 0) {
	    			contextString = contextString + '.';
	    		}

	    		contextString = contextString + currentContext.string;
	    	}
	    }

	    this.token = token;
	    this.search(token.string, contextString);
	},

	search : function(value, context) {
        var _self = this;

        //start callback
        if (this.cfg.onstart) {
            this.cfg.onstart.call(this, value);
        }

        var options = {
            source: this.id,
            update: this.id,
            formId: this.formId,
            onsuccess: function(responseXML, status, xhr) {

            	if (_self.cfg.onsuccess) {
            		_self.cfg.onsuccess.call(this, responseXML, status, xhr);
            	}
            	
                var xmlDoc = $(responseXML.documentElement);
                var updates = xmlDoc.find("update");

                for (var i = 0; i < updates.length; i++) {
                    var update = updates.eq(i);
                    var id = update.attr('id');
                    var data = update.text();

                    if (id == _self.id) {
                    	_self.suggestions = [];
                    	
                    	var parsedSuggestions = $(data).filter(function() { return $(this).is('ul') }).children();
                    	
                    	parsedSuggestions.each(function() {
                    		_self.suggestions.push($(this).html());
                    	});

                    	CodeMirror.simpleHint(_self.instance, PrimeFacesExt.widget.CodeMirror.getSuggestions);
                    } else {
                        PrimeFaces.ajax.AjaxUtils.updateElement.call(this, id, data);
                    }
                }

                PrimeFaces.ajax.AjaxUtils.handleResponse.call(this, xmlDoc);

                return true;
            }
        };

        //complete callback
        if (this.cfg.oncomplete) {
            options.oncomplete = this.cfg.oncomplete;
        }

        //error callback
        if (this.cfg.onerror) {
            options.onerror = this.cfg.onerror;
        }
        
        //process
        options.process = this.cfg.process ? this.id + ' ' + this.cfg.process : this.id;

        if (this.cfg.global === false) {
            options.global = false;
        }

        options.params = [
	        {name: this.id + '_token', value: encodeURIComponent(value) },
	        {name: this.id + '_context', value: encodeURIComponent(context) }
        ];

        PrimeFaces.ajax.AjaxRequest(options);
    },

	/**
	 * This method fires an event if the behavior was defined.
	 *
	 * @param {string} eventName The name of the event.
	 * @private
	 */
	fireEvent : function(eventName) {
		if (this.cfg.behaviors) {
			var callback = this.cfg.behaviors[eventName];
		    if (callback) {
		    	var ext = {
		    			params: []
		    	};
	
		    	callback.call(this, null, ext);
		    }
		}
	},

	/**
	 * Returns the CodeMirror instance.
	 */
	getCodeMirrorInstance : function() {
	    return this.instance;
	}
});

PrimeFacesExt.widget.CodeMirror.getSuggestions = function(editor) {
    return {
    	list: editor.widgetInstance.suggestions,
        from: { line: editor.getCursor().line, ch: editor.widgetInstance.token.start },
        to: { line: editor.getCursor().line, ch: editor.widgetInstance.token.end }
    };
};
