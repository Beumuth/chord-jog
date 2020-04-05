class FingerSelect extends HTMLSelectElement {
	static TAG_NAME = "finger-select";
	
	constructor(options) {
		super();
		this.initialOptions = {
			finger: options.finger !== undefined ?
				options.finger :
				Finger.UNKNOWN
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", FingerSelect.TAG_NAME);
		this.classList.add("enumSelect");
		
		//Create finger options
		[Finger.UNKNOWN]
			.concat(Fingers.FINGERFUL)
			.forEach(finger =>
				this.append(new Option(
					finger,	//text
					finger,	//value
					false,	//defaultSelected
					finger === this.initialOptions.finger	//selected
				));
			);
	}
	
	get finger() {
		return Finger.fromString(
			this.options[this.selectedIndex].value
		);
	}
	
	set finger(finger) {
		const fingerAsString = Finger.toString(finger);
		this.selectedIndex = Integer
			.range(0, this.options.length)
			.find(i => this.options[i].value === fingerAsString);
	}
}

customElements.define(
	FingerSelect.TAG_NAME,
	FingerSelect,
	{extends: "select"}
);