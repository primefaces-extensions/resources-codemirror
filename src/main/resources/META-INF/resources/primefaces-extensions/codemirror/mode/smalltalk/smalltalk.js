CodeMirror.defineMode('smalltalk', function(config, modeConfig) {

	var specialChars = /[+\-/\\*~<>=@%|&?!.:;^]/;
	var keywords = /true|false|nil|self|super|thisContext/;

	var Context = function(tokenizer, parent) {
		this.next = tokenizer;
		this.parent = parent;
	};

	var Token = function(name, context, eos) {
		this.name = name;
		this.context = context;
		this.eos = eos;
	};

	var State = function() {
		this.context = new Context(next, null);
		this.expectVariable = true;
		this.indentation = 0;
		this.userIndentationDelta = 0;
	};

	State.prototype.userIndent = function(indentation) {
		this.userIndentationDelta = indentation > 0 ? (indentation / config.indentUnit - this.indentation) : 0;
	};

	var next = function(stream, context, state) {
		var token = new Token(null, context, false);
		var currentChar = stream.next();

		if (currentChar === '"') {
			token = nextComment(stream, new Context(nextComment, context));

		} else if (currentChar === '\'') {
			token = nextString(stream, new Context(nextString, context));

		} else if (currentChar === '#') {
			stream.eatWhile(/[^ .]/);
			token.name = 'string-2';

		} else if (currentChar === '$') {
			stream.eatWhile(/[^ ]/);
			token.name = 'string-2';

		} else if (currentChar === '|' && state.expectVariable) {
			token.context = new Context(nextTemporaries, context);

		} else if (/[\[\]{}()]/.test(currentChar)) {
			token.name = 'bracket';
			token.eos = /[\[{(]/.test(currentChar);

			if (currentChar === '[') {
				state.indentation++;
			} else if (currentChar === ']') {
				state.indentation = Math.max(0, state.indentation - 1);
			}

		} else if (specialChars.test(currentChar)) {
			stream.eatWhile(specialChars);
			token.name = 'operator';
			token.eos = currentChar !== ';'; // ; cascaded message expression

		} else if (/\d/.test(currentChar)) {
			stream.eatWhile(/[\w\d]/);
			token.name = 'number'

		} else if (/[\w_]/.test(currentChar)) {
			stream.eatWhile(/[\w\d_]/);
			token.name = state.expectVariable ? (keywords.test(stream.current()) ? 'keyword' : 'variable') : null;

		} else {
			token.eos = state.expectVariable;
		}

		return token;
	};

	var nextComment = function(stream, context) {
		stream.eatWhile(/[^"]/);
		return new Token('comment', stream.eat('"') ? context.parent : context, true);
	};

	var nextString = function(stream, context) {
		stream.eatWhile(/[^']/);
		return new Token('string', stream.eat('\'') ? context.parent : context, false);
	};

	var nextTemporaries = function(stream, context, state) {
		var token = new Token(null, context, false);
		var currentChar = stream.next();

		if (currentChar === '|') {
			token.context = context.parent;
			token.eos = true;

		} else {
			stream.eatWhile(/[^|]/);
			token.name = 'variable';
		}

		return token;
	}

	return {
		startState: function() {
			return new State;
		},

		token: function(stream, state) {
			state.userIndent(stream.indentation());

			if (stream.eatSpace()) {
				return null;
			}

			var token = state.context.next(stream, state.context, state);
			state.context = token.context;
			state.expectVariable = token.eos;

			state.lastToken = token;
			return token.name;
		},

		blankLine: function(state) {
			state.userIndent(0);
		},

		indent: function(state, textAfter) {
			var i = state.context.next === next && textAfter && textAfter.charAt(0) === ']' ? -1 : state.userIndentationDelta;
			return (state.indentation + i) * config.indentUnit;
		},

		electricChars: ']'
	};

});

CodeMirror.defineMIME('text/x-stsrc', {name: 'smalltalk'});