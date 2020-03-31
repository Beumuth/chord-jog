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
	
	get fingerSelect() {
		return $(this).find("[is='finger-select']").get(0);
	}
	
	get relativeFretSelect() {
		return $(this).find("[is='relative-fret-select']").get(0);
	}
	
	connectedCallback() {
		let label = document.createElement("label");
		label.className = "stringLabel";
		label.textContent = this.initialOptions.label;
		this.append(label);
		this.append(new FingerSelect({
			string: this.initialOptions.string,
			finger: this.initialOptions.finger
		}));
		this.append(new RelativeFretSelect({
			string: this.initialOptions.string,
			fret: this.initialOptions.fret
		}));
	}
}

customElements.define(
	"editable-shape-string",
	EditableShapeString,
	{extends: "li"}
);