class TextInput {
	static selectAllText(textInput) {
		textInput.setSelectionRange(0, textInput.value.length);
	}
}