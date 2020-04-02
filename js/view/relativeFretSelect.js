class RelativeFretSelect extends HTMLSelectElement {
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			fret: options.fret !== undefined ?
				options.fret :
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
		if(this.initialOptions.fret !== null) {
			this.fret = this.initialOptions.fret;
		}
		this.classList.add("enumSelect");
	}
	
	get fret() {
		const fret = this.options[this.selectedIndex].value;
		return isNaN(fret) ? fret : parseInt(fret);
	}
	
	set fret(fret) {
		this.selectedIndex = Integer
			.range(0, this.initialOptions.length)
			.find(i => this.initialOptions[i].value === fret + "");
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