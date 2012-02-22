/**
 * PrimeFaces Extensions CodeMirror Widget
 * 
 * @author Thomas Andraschko
 * @constructor
 */
PrimeFacesExt.widget.CodeMirror = function(cfg) {
	this.id = cfg.id;
	this.cfg = cfg;
	this.jqId = PrimeFaces.escapeClientId(this.id);
	this.jq = $(this.jqId);

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

	this.postConstruct();
}

PrimeFaces.extend(PrimeFacesExt.widget.CodeMirror, PrimeFaces.widget.BaseWidget);

/**
 * This method fires an event if the behavior was defined.
 *
 * @author Thomas Andraschko
 * @param {string} eventName The name of the event.
 * @private
 */
PrimeFacesExt.widget.CodeMirror.prototype.fireEvent = function(eventName) {
	if (this.cfg.behaviors) {
		var callback = this.cfg.behaviors[eventName];
	    if (callback) {
	    	var ext = {
	    			params: {}
	    	};

	    	callback.call(this, null, ext);
	    }
	}
}
