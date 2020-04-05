class EditableStringAction extends HTMLSpanElement {	
	static TAG_NAME = "editable-string-action";

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
		this.setAttribute("is", EditableStringAction.TAG_NAME);
		this.style.display = "inline-block";
		const label = document.createElement("label");
		this.append(label);
		label.className = "stringLabel";
		label.textContent = this.initialOptions.label;
		label.style.float = "right";
		label.style.clear = "right";
		label.style.textAlign = "center";
		label.style.width = 23;
		
		const relativeFretSelect = new RelativeFretSelect(
			StringAction.fret(this.initialOptions.stringAction)
		);
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
	
	get stringAction() {
		return StringAction.withFretAndFinger(
			this.fret,
			this.finger
		);
	}
	
	set stringAction(stringAction) {
		this.finger = StringAction.finger(stringAction);
		this.fret = StringAction.fret(stringAction);
	}
	
	get fret() {
		return this.relativeFretSelect.fret;
	}
	
	set fret(fret) {
		this.relativeFretSelect.fret = fret;
	}
	
	get finger() {
		return Fret.isFingerless(this.fret) ?
			Finger.NONE :
			this.fingerSelect.finger;
	}
	
	set finger(finger) {
		this.fingerSelect.finger = finger;
	}
	
	get fingerSelect() {
		return this.querySelector("[is='finger-select']");
	}
	
	get relativeFretSelect() {
		return this.querySelector("[is='relative-fret-select']");
	}
	
	fretChanged() {
		if(Fret.isFingerless(this.fret)) {
			
		}
	}
}

customElements.define(
	EditableStringAction.TAG_NAME,
	EditableStringAction,
	{extends: "span"}
);