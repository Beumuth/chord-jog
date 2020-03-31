class RelativeFretSelect extends HTMLSelectElement {
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			selectedFret: options.selectedFret !== undefined ?
				options.selectedFret :
				null,
			includeAnyFret: options.includeAnyFret ?
				options.includeAnyFret :
				false
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", "relative-fret-select");
		this.setAttribute("string", this.initialOptions.string);
		if(this.initialOptions.includeAnyFret) {
			this.append(new Option(ANY_FRET, ANY_FRET));
		}
		this.append(new Option(DEAD_STRING, DEAD_STRING));
		Integer
			.range(ROOT_FRET, MAX_SHAPE_RANGE)
			.forEach(i => this.append(new Option(i, i)));
		if(this.initialOptions.selectedFret !== null) {
			this.fret = this.initialOptions.selectedFret;
		}
		this.classList.add("enumSelect");
	}
	
	get fret() {
		let fret = this.options[this.selectedIndex].value;
		return fret === "null" ?
			null :
			fret === ANY_FRET ?
				ANY_FRET :
				parseInt(fret);
	}
	
	set fret(fret) {
		this.selectedIndex = Integer
			.range(0, this.initialOptions.length)
			.find(i => this.initialOptions[i].value == fret);
	}
	
	get string() {
		return parseInt(this.getAttribute("string"));
	}
}

window.customElements.define(
	"relative-fret-select",
	RelativeFretSelect,
	{extends: "select"}
);