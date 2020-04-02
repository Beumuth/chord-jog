class EditableShapeString extends HTMLLIElement {
	static TYPE_OPEN_STRING = "open";
	static TYPE_DEAD_STRING = "dead";
	static TYPE_FINGER_ON_FRET = "fingerOnFret";
	
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			label: options.label,
			stringAction: options.stringAction != null ?
				options.stringAction :
				StringAction.DEAD_STRING
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", "editable-shape-string");
		this.style.display = "inline-block";
		const label = document.createElement("label");
		this.append(label);
		label.className = "stringLabel";
		label.textContent = this.initialOptions.label;
		label.style.float = "right";
		label.style.clear = "right";
		label.style.textAlign = "center";
		label.style.width = 23;
		
		const relativeFretSelect = new RelativeFretSelect({
			string: this.initialOptions.string,
			fret: StringAction.fret(this.initialOptions.stringAction)
		});
		this.append(relativeFretSelect);
		relativeFretSelect.style.float = "right";
		relativeFretSelect.style.clear = "right";
		relativeFretSelect.style.marginBottom = -1;
		
		const fingerSelect = new FingerSelect({
			string: this.initialOptions.string,
			finger: StringAction.finger(this.initialOptions.stringAction)
		});
		this.append(fingerSelect);
		fingerSelect.style.float = "right";
		fingerSelect.style.clear = "right";
		fingerSelect.disabled = StringAction.isFingerless(
			this.initialOptions.stringAction
		);
	}
	
	get type() {
		return this.dataset.type;
	}
	
	set type(type) {
		switch(type) {
			case EditableShapeString.TYPE_OPEN_STRING:
				this.fret = OPEN_FRET;
				this.finger = NO_FINGER;
				break;
			case EditableShapeString.TYPE_DEAD_STRING:
				this.fret = DEAD_STRING;
				this.finger = NO_FINGER;
				break;
		}
		this.dataset.type = type;
	}
	
	get fingerSelect() {
		return this.querySelector("[is='finger-select']");
	}
	
	get relativeFretSelect() {
		return this.querySelector("[is='relative-fret-select']");
	}
	
	get fret() {
		return this.relativeFretSelect.fret;
	}
	
	set fret(fret) {
		this.relativeFretSelect.fret = fret;
	}
	
	get finger() {
		return this.fingerSelect.finger;
	}
	
	set finger(finger) {
		this.fingerSelect.finger = finger;
	}
}

customElements.define(
	"editable-shape-string",
	EditableShapeString,
	{extends: "li"}
);