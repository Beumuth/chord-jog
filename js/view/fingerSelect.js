class FingerSelect extends HTMLSelectElement {
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			selectedFinger: options.selecteFinger !== undefined ?
				options.selectedFinger :
				null
		};
		this.FINGER_LABELS = new Map([
			[null, '?'],
			[0, 'T'],
			[1, '1'],
			[2, '2'],
			[3, '3'],
			[4, '4']
		]);
	}
	
	connectedCallback() {
		//Create select
		this.fingerSelect = document.createElement("select");
		this.fingerSelect.className = "fingerSelect";
		this.fingerSelect.classList.add("enumSelect");
		this.fingerSelect.onchange = this.fingerSelectChanged.bind(this);
		
		//Create options
		for(let [finger, label] of this.FINGER_LABELS.entries()) {
			let curOption = document.createElement("option");
			curOption.className = "fingerOption";
			curOption.value = finger;
			curOption.textContent = label;
			this.fingerSelect.append(curOption);
		}
		
		//Optionally select an option
		if(this.initialOptions.selectedFinger !== null) {
			this.finger = this.initialOptions.selectedFinger;
		}
	}
	
	fingerSelectChanged() {
		let selectedOption = this.fingerSelect.options[
			this.fingerSelect.selectedIndex
		].value;
		this.finger = selectedOption === "null" ? null : parseInt(selectedOption);
	}
	
	get finger() {
		let selectedOption = this.fingerSelect.options[
			this.fingerSelect.selectedIndex
		].value;
		return selectedOption === "null" ? null : parseInt(selectedOption);
	}
	
	set finger(finger) {
		this.selectedIndex = Integer
			.range(0, this.options.length)
			.find(i =>
				(this.options[i].value === "null" && finger === null) ||
				this.options[i].value == finger
			);
	}
}

window.customElements.define(
	"finger-select",
	FingerSelect,
	{extends: "select"}
);