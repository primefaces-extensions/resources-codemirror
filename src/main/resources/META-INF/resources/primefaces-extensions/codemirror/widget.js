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
		    			params: {}
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
