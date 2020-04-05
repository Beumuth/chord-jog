class RelativeFretSelect extends HTMLSelectElement {
	static TAG_NAME = "relative-fret-selet";
	
	constructor(options) {
		super();
		this.initialOptions = {
			fret: options.fret !== undefined ?
				options.fret :
				options.includesAnyFret ?
					Fret.ANY_FRET :
					Fret.DEAD_STRING,
			includeAnyFret: options.includeAnyFret ?
				options.includeAnyFret :
				false
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", RelativeFretSelect.TAG_NAME);
		this.classList.add("enumSelect");
		
		//Build the list of RelativeFrets that are represented
		Conditional
			.returnIfTrue(
				this.initialOptions.includeAnyFret,
				[RelativeFret.ANY],
				[]
			).concat(RelativeFrets.FINGERLESS)
			.concat(RelativeFrets.FINGERFULL)
			//And add an <option> for each
			.forEach(relativeFret =>
				this.append(new Option(
					relativeFret,	//text
					relativeFret,	//value
					false,			//defaultSelected
					this.initialOptions.fret === relativeFret	//selected
				))
			);
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
}

window.customElements.define(
	RelativeFretSelect.TAG_NAME,
	RelativeFretSelect,
	{extends: "select"}
);