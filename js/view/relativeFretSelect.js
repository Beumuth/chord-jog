class RelativeFretSelect extends HTMLSelectElement {
	constructor(options) {
		super();
		
		this.setAttribute("is", "relative-fret-select");
		
		this.setAttribute("string", options.string);
		this.frets = [ANY_FRET, null, 0, 1, 2, 3, 4];
		this.fretLabels = [ANY_FRET, "x", "0", "1", "2", "3", "4"];
		if(options.nullable !== true) {
			this.frets.splice(0, 1);
			this.fretLabels.splice(0, 1);
		}
		
		this.fret = options.fret !== undefined ? options.fret : this.frets[0];
		this.className = "relativeFretSelect";
		this.classList.add("enumSelect");
		for(let i = 0; i < this.frets.length; ++i) {
			let curOption = document.createElement("option");
			curOption.className = "fretOption";
			curOption.value = this.frets[i];
			curOption.textContent = this.fretLabels[i];
			this.append(curOption);
		}
		this.onchange = this.fretSelectOnChange.bind(this);
	}
	
	fretSelectOnChange() {
		this.setAttribute("fret", this.options[this.selectedIndex].value);
	}
	
	get fret() {
		let fret = this.getAttribute("fret");
		return fret === "null" ?
			null :
			fret === ANY_FRET ?
				ANY_FRET :
				parseInt(fret);
	}
	
	set fret(fret) {
		this.setAttribute("fret", fret);
		this.selectedIndex = this.frets.indexOf(fret);
	}
}

customElements.define(
	"relative-fret-select",
	RelativeFretSelect,
	{extends: "select"}
);