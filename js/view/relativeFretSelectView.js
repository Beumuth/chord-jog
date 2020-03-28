class RelativeFretSelectView {
	constructor(options) {
		this.string = options.string;
		this.frets = [ANY_FRET, null, 0, 1, 2, 3, 4];
		this.fretLabels = [ANY_FRET, "x", "0", "1", "2", "3", "4"];
		if(options.nullable !== true) {
			this.frets.splice(0, 1);
			this.fretLabels.splice(0, 1);
		}
		this.fret = options.fret !== undefined ? options.fret : this.frets[0];
		
		this.initializeHtml();
	}
	
	initializeHtml() {
		this.fretSelect = document.createElement("select");
		this.fretSelect.className = "relativeFretSelect";
		this.fretSelect.classList.add("enumSelect");
		this.fretSelect.dataset.string = this.string;
		for(let i = 0; i < this.frets.length; ++i) {
			let curOption = document.createElement("option");
			curOption.className = "fretOption";
			curOption.value = this.frets[i];
			curOption.textContent = this.fretLabels[i];
			this.fretSelect.append(curOption);
		}
		this.fretSelect.onchange = this.fretSelectOnChange.bind(this);
	}
	
	fretSelectOnChange() {
		let selectedFret = this.fretSelect.options[this.fretSelect.selectedIndex].value
		this.fret = selectedFret === "null" ? null :
			selectedFret === ANY_FRET ? ANY_FRET :
				parseInt(selectedFret);
	}
	
	setFret(fret) {
		this.fret = fret;
		this.fretSelect.selectedIndex = this.frets.indexOf(fret);
	}
}