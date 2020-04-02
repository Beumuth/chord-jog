class FingerSelect extends HTMLSelectElement {
	static FINGER_SELECT_CHANGED = "fingerSelectChanged";
	
	constructor(options) {
		super();
		this.initialOptions = {
			string: options.string,
			finger: options.finger !== undefined ?
				options.finger :
				null
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", "finger-select");
		
		//Create select
		this.classList.add("enumSelect");
		
		//Create finger options
		[Finger.UNKNOWN_FINGER].concat(Finger.ALL_FINGERS).forEach(finger =>
			this.createFingerOption(finger)
		);
		
		//Optionally select an option
		if(this.initialOptions.finger !== null) {
			this.finger = this.initialOptions.finger;
		}
	}
	
	get finger() {
		const selectedOption = this.options[this.selectedIndex].value;
		return isNaN(selectedOption) ? selectedOption : parseInt(selectedOption);
	}
	
	set finger(finger) {
		this.selectedIndex = Integer
			.range(0, this.options.length)
			.find(i => this.options[i].value === finger + "");
	}
	
	createFingerOption(finger) {
		const option = document.createElement("option");
		this.append(option);
		option.className = "fingerOption";
		option.value = finger;
		option.textContent = finger;
	}
}

customElements.define(
	"finger-select",
	FingerSelect,
	{extends: "select"}
);