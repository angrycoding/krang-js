define(['Tokenizer', '../Utils'], function(Tokenizer, Utils) {

	var tokenizer, fileName, context;

	var T_OR, T_AND, T_NOT, T_DOT, T_LPAREN, T_RPAREN,
		T_EQUAL, T_NOT_EQUAL, T_LESS_OR_EQUAL, T_GREATER_OR_EQUAL,
		T_LESS_THAN, T_GREATER_THAN, T_NUMBER, T_STRING, T_ID;

	var P_NUMBER = 1, P_STRING = 2, P_SELECTOR = 3, P_NOT = 4,
		P_LESS_THAN = 5, P_GREATER_THAN = 6, P_LESS_OR_EQUAL = 7,
		P_GREATER_OR_EQUAL = 8, P_EQUAL = 9, P_NOT_EQUAL = 10,
		P_AND = 11, P_OR = 12;

	function initialize() {
		if (tokenizer) return;
		tokenizer = new Tokenizer();
		T_OR = tokenizer.addToken('or\\b');
		T_AND = tokenizer.addToken('and\\b');
		T_NOT = tokenizer.addToken('not\\b');
		T_DOT = tokenizer.addToken('\\.');
		T_LPAREN = tokenizer.addToken('\\(');
		T_RPAREN = tokenizer.addToken('\\)');
		T_EQUAL = tokenizer.addToken('=');
		T_NOT_EQUAL = tokenizer.addToken('<>');
		T_LESS_OR_EQUAL = tokenizer.addToken('<=');
		T_GREATER_OR_EQUAL = tokenizer.addToken('>=');
		T_LESS_THAN = tokenizer.addToken('<');
		T_GREATER_THAN = tokenizer.addToken('>');
		T_NUMBER = tokenizer.addToken(['[0-9]*\\.[0-9]+', '[0-9]+']);
		T_STRING = tokenizer.addToken([
			'\'(?:[^\'\\\\]|\\\\.)*\'',
			'\"(?:[^\"\\\\]|\\\\.)*\"'
		]);
		T_ID = tokenizer.addToken('[a-zA-Z_$][a-zA-Z0-9_$]*');
		tokenizer.addIgnore('[\x09\x0A\x0D\x20]+');
	}

	function parseError(expected, found) {
		var expected = (expected || 'EOF');
		var found = (found || tokenizer.getFragment());
		var errorMessage = ('parse error: "' + expected +
			'" expected, but "' + found + '" found ' +
			'(' + fileName + ')');
		return {
			fileName: fileName,
			expected: expected, found: found,
			toString: function() { return errorMessage; }
		};
	}

	function parseSimpleExpression() {
		if (tokenizer.test(T_NUMBER)) {
			var value = tokenizer.next();
			value = parseFloat(value.value, 10);
			return [P_NUMBER, value];
		} else if (tokenizer.test(T_STRING)) {
			var value = tokenizer.next();
			return [P_STRING, value.value.slice(1, -1)];
		} else if (tokenizer.test(T_ID)) {
			var value = tokenizer.next();
			return [P_SELECTOR, [value.value]];
		} else if (tokenizer.next(T_LPAREN)) {
			if (tokenizer.next(T_RPAREN))
				throw new parseError('expression', '()');
			try {
				var value = parseExpression();
			} finally {
				if (!tokenizer.next(T_RPAREN))
					throw new parseError(')');
			}
			return value;
		}
		else throw new parseError('expression');
	}

	function parsePrimaryExpression() {
		var left = parseSimpleExpression();
		if (!tokenizer.test(T_DOT)) return left;
		if (left[0] !== P_SELECTOR)
			throw new parseError();
		while (tokenizer.next(T_DOT)) {
			if (!tokenizer.test(T_ID))
				throw new parseError('identifier');
			left[1].push(tokenizer.next().value);
		}
		return left;
	}

	function parseUnaryExpression() {
		return (tokenizer.next(T_NOT) && [
			P_NOT, parseUnaryExpression()
		] || parsePrimaryExpression());
	}

	function parseRelExpression() {
		var left = parseUnaryExpression();
		return (tokenizer.next(T_LESS_OR_EQUAL) && [
			P_LESS_OR_EQUAL, left, parseUnaryExpression()
		] || tokenizer.next(T_LESS_THAN) && [
			P_LESS_THAN, left, parseUnaryExpression()
		] || tokenizer.next(T_GREATER_OR_EQUAL) && [
			P_GREATER_OR_EQUAL, left, parseUnaryExpression()
		] || tokenizer.next(T_GREATER_THAN) && [
			P_GREATER_THAN, left, parseUnaryExpression()
		] || left);
	}

	function parseEqExpression() {
		var left = parseRelExpression();
		while (tokenizer.next(T_EQUAL) && (
			left = [P_EQUAL, left, parseRelExpression()]
		) || tokenizer.next(T_NOT_EQUAL) && (
			left = [P_NOT_EQUAL, left, parseRelExpression()]
		)){};
		return left;
	}

	function parseAndExpression() {
		var left = parseEqExpression();
		while (tokenizer.next(T_AND) && (
			left = [P_AND, left, parseEqExpression()]
		)){};
		return left;
	}

	function parseExpression() {
		var left = parseAndExpression();
		while (tokenizer.next(T_OR) && (
			left = [P_OR, left, parseAndExpression()]
		)){};
		return left;
	}

	function parseString() {
		var result = parseExpression();
		if (!tokenizer.test(Tokenizer.T_EOF))
			throw new parseError('EOF');
		return result;
	}

	function evalNode(node) {
		var type = node[0];
		switch (type) {
			case P_NUMBER:
			case P_STRING:
				return node[1];
			case P_OR:
			case P_NOT:
			case P_AND:
				var left = toBoolean(evalNode(node[1]));
				if (type === P_NOT) return (!left);
				if (left && type === P_OR) return true;
				var right = toBoolean(evalNode(node[2]));
				if (type === P_AND) return (left && right);
				if (type === P_OR) return (left || right);
			case P_EQUAL:
			case P_NOT_EQUAL:
			case P_LESS_THAN:
			case P_GREATER_THAN:
			case P_LESS_OR_EQUAL:
			case P_GREATER_OR_EQUAL:
				var left = evalNode(node[1]);
				var right = evalNode(node[2]);
				if (type === P_EQUAL) return (left === right);
				if (type === P_NOT_EQUAL) return (left !== right);
				if (type === P_LESS_THAN) return (left < right);
				if (type === P_GREATER_THAN) return (left > right);
				if (type === P_LESS_OR_EQUAL) return (left <= right);
				if (type === P_GREATER_OR_EQUAL) return (left >= right);
			case P_SELECTOR:
				var c, fragment;
				var result = context, selector = node[1];
				for (c = 0; c < selector.length; c++) {
					fragment = selector[c];
					if (!Utils.hasOwnProperty(result, fragment)) {
						result = undefined;
						break;
					} else result = result[fragment];
				}
				return result;
		}
	}

	function toBoolean(value) {
		if (value === undefined) return false;
		if (value === null) return false;
		if (value === true) return true;
		if (value === false) return false;
		if (typeof(value) === 'number') return (value !== 0);
		if (typeof(value) === 'string') return (value.length !== 0);
		if (value instanceof Array) return (value.length !== 0);
		if (value instanceof Function) return true;
		if (value instanceof Object) return true;
	}

	function Parser(input, baseURI) {
		initialize();
		fileName = baseURI;
		tokenizer.tokenize(input);
		return parseString();
	}

	function Evaluator(ctx) {
		return function(input, baseURI) {
			context = ctx;
			var expressionAST = Parser(input, baseURI);
			var expressionResult = evalNode(expressionAST);
			return toBoolean(expressionResult);
		};
	}

	return Evaluator;
});