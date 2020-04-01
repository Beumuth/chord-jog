class EditableShapeString extends HTMLLIElement {
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			label: options.label,
			fret: options.fret,
			finger: options.finger
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
			fret: this.initialOptions.fret
		});
		this.append(relativeFretSelect);
		relativeFretSelect.style.float = "right";
		relativeFretSelect.style.clear = "right";
		relativeFretSelect.style.marginBottom = -1;
		
		const fingerSelect = new FingerSelect({
			string: this.initialOptions.string,
			finger: this.initialOptions.finger
		});
		this.append(fingerSelect);
		fingerSelect.style.float = "right";
		fingerSelect.style.clear = "right";
	}
	
	get fingerSelect() {
		return this.querySelector("[is='finger-select']");
	}
	
	get relativeFretSelect() {
		return this.querySelector("[is='relative-fret-select']");
	}
}

customElements.define(
	"editable-shape-string",
	EditableShapeString,
	{extends: "li"}
);