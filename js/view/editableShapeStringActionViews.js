class EditableShapeStringActionViews {
	constructor() {
		this.strings = new Array(
			new EditableStringActionViews("E", 0),
			new EditableStringActionViews("A", 1),
			new EditableStringActionViews("D", 2),
			new EditableStringActionViews("G", 3),
			new EditableStringActionViews("B", 4),
			new EditableStringActionViews("e", 5)
		);
	}
}

class EditableStringActionViews {
	constructor(
		stringLabel,
		stringIndex,
		stringAction = StringAction.DeadString()
	) {
		this.stringLabel = stringLabel;
		this.stringIndex = stringIndex;
		this.stringAction = stringAction;
		this.initializeHtml();
	}
	
	initializeHtml() {
		this.label = document.createElement("span");
		this.label.className = "stringActionInputLabel";
		this.label.textContent = this.stringLabel;
		this.fingerSelect = new FingerSelect({
			string: this.stringIndex,
			selectedFinger: this.stringAction.finger
		});
		this.relativeFretSelect = new RelativeFretSelect({
			string: this.stringIndex,
			selectedFret: this.stringAction.fret
		});
	}
}