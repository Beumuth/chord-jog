class FingerSelectView {
	constructor(finger=null) {
		this.finger = finger;
		this.FINGER_LABELS = new Map([
			[null, '?'],
			[0, 'T'],
			[1, '1'],
			[2, '2'],
			[3, '3'],
			[4, '4']
		]);
		this.initializeHtml();
	}
	
	initializeHtml() {
		//Create select
		this.fingerSelect = document.createElement("select");
		this.fingerSelect.className = "fingerSelect";
		this.fingerSelect.onchange = this.fingerSelectChanged.bind(this);
		
		//Create options
		for(let [finger, label] of this.FINGER_LABELS.entries()) {
			let curOption = document.createElement("option");
			curOption.className = "fingerOption";
			curOption.value = finger;
			curOption.textContent = label;
			this.fingerSelect.append(curOption);
		}
	}
	
	fingerSelectChanged() {
		let selectedOption = this.fingerSelect.options[
			this.fingerSelect.selectedIndex
		].value;
		this.finger = selectedOption === "null" ? null : parseInt(selectedOption);
	}
}