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
		stringAction=new Array(null, null)
	) {
		this.stringLabel = stringLabel;
		this.stringAction = stringAction;
		this.initializeHtml();
	}
	
	initializeHtml() {
		this.label = document.createElement("span");
		this.label.className = "stringActionInputLabel";
		this.label.textContent = this.stringLabel;
		this.fingerSelectView = new FingerSelectView(this.stringAction[0])
		this.relativeFretSelectView = new RelativeFretSelectView({
			string: this.stringIndex,
			fret: this.stringAction[1]
		});
	}
}