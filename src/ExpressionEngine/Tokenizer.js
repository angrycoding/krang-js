define(function() {

	var T_EOF = -1,
	T_FRAGMENT = 0,
	T_KIND_IGNORE = 1,
	T_KIND_TOKEN = 2;

	var Tokenizer = function() {

		var lastTokenId = 0;
		var tokenStrings = [];
		var tokenDefinitions = [[], []];

		var currentToken;
		var inputString, inputStringLength;
		var textData, textLength, tokenInfo;
		var match, matchLength, gIndex, matchIndex;
		var tokenOffset, tokenBuffer, tokenBufferLength;

		function processToken() {
			if (tokenOffset !== inputStringLength) {
				if (match = tokenDefinitions[0].exec(inputString)) {
					matchLength = match.length;
					for (gIndex = 1; gIndex < matchLength; gIndex++) {
						textData = match[gIndex];
						if (!textData) continue;
						matchIndex = match.index;
						if (textLength = matchIndex - tokenOffset) {
							tokenBufferLength = tokenBuffer.push({
								type: T_FRAGMENT,
								pos: tokenOffset,
								value: inputString.substr(
									tokenOffset, textLength
								)
							});
							tokenOffset += textLength;
						}
						textLength = textData.length;
						tokenOffset = (matchIndex + textLength);
						tokenInfo = tokenDefinitions[1][gIndex - 1];
						switch (tokenInfo[0]) {
							case T_KIND_TOKEN:
								tokenBufferLength = tokenBuffer.push({
									type: tokenInfo[1],
									pos: matchIndex,
									value: textData
								});
								break;
							default: processToken();
						}
						break;
					}
				} else if (textLength = inputStringLength - tokenOffset) {
					tokenBufferLength = tokenBuffer.push({
						type: T_FRAGMENT,
						pos: tokenOffset,
						value: inputString.substr(
							tokenOffset, textLength
						)
					});
					tokenOffset += textLength;
				}
			} else {
				tokenBufferLength = tokenBuffer.push({
					type: T_EOF,
					value: 'EOF',
					pos: inputStringLength
				});
			}
		}

		function nextToken() {
			if (!tokenBufferLength) processToken();
			tokenBufferLength--;
			currentToken = tokenBuffer.shift();
		}

		function addTokens(tokens, kind) {
			if (typeof(tokens) !== 'object') tokens = [tokens];
			lastTokenId++;
			tokenStrings.push('(' + tokens.join('|') + ')');
			tokenDefinitions[1].push([kind, lastTokenId]);
			return lastTokenId;
		}

		this.addToken = function(tokens) {
			return addTokens(tokens, T_KIND_TOKEN);
		};

		this.addIgnore = function(ignores) {
			return addTokens(ignores, T_KIND_IGNORE);
		};

		this.tokenize = function(input) {
			tokenOffset = 0;
			tokenBuffer = [];
			tokenBufferLength = 0;
			currentToken = null;
			inputString = input;
			inputStringLength = input.length;
			tokenDefinitions[0] = tokenStrings.join('|');
			tokenDefinitions[0] = new RegExp(tokenDefinitions[0], 'g');
			nextToken();
		};

		this.getFragment = function() {
			return (
				currentToken.value ?
				currentToken.value :
				inputString.substr(
					currentToken.pos,
					currentToken.len
				)
			);
		};

		this.test = function(tokenType) {
			return (currentToken.type === tokenType);
		};

		this.next = function(tokenType) {
			if (tokenType === undefined ||
				this.test(tokenType)) {
				var token = currentToken;
				return (nextToken(), token);
			}
		};

	};

	Tokenizer.T_EOF = T_EOF;
	Tokenizer.T_FRAGMENT = T_FRAGMENT;

	return Tokenizer;
});