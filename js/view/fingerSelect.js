class FingerSelect extends HTMLSelectElement {
	static FINGER_SELECT_CHANGED = "fingerSelectChanged";
	
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
		this.setAttribute("is", "finger-select");
		
		//Create select
		this.classList.add("enumSelect");
		
		//Create options
		for(let [finger, label] of this.FINGER_LABELS.entries()) {
			const curOption = document.createElement("option");
			this.append(curOption);
			curOption.className = "fingerOption";
			curOption.value = finger;
			curOption.textContent = label;
		}
		
		//Optionally select an option
		if(this.initialOptions.selectedFinger !== null) {
			this.finger = this.initialOptions.selectedFinger;
		}
	}
	
	get finger() {
		const selectedOption = this.options[this.selectedIndex].value;
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

customElements.define(
	"finger-select",
	FingerSelect,
	{extends: "select"}
);