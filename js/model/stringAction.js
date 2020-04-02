class StringAction {
	static DEAD_STRING = "x";
	static OPEN_STRING = "o";
	
	constructor(fret=DEAD_STRING, finger=Finger.NO_FINGER) {
		this.fret = fret;
		this.finger = finger;
	}
	
	static withFretAndFinger(fret, finger) {
		return new StringAction(fret, finger);
	}
	
	static fret(stringAction) {
		return StringAction.isFingerless(stringAction) ?
			DEAD_STRING :
			stringAction.fret;
	}
	
	static finger(stringAction) {
		return StringAction.isFingerless(stringAction) ?
			Finger.NO_FINGER :
			stringAction.finger;
	}
	
	static equals(a, b) {
		return StringAction.isFingerless(a) && StringAction.isFingerless(b) ?
			a === b :
			a.fret === b.fret && a.finger === b.finger;
	}
	
	static copy(stringAction) {
		return StringAction.isFingerless(stringAction) ?
			stringAction :
			new StringAction(stringAction.fret, stringAction.finger);
	}
	
	static isFingerless(stringAction) {
		return [StringAction.DEAD_STRING, StringAction.OPEN_STRING].includes(
			stringAction
		);
	}
	
	static toString(stringAction) {
		return StringAction.isFingerless(stringAction) ?
			stringAction :
			stringAction.fret + "," + stringAction.finger;
	}
	
	static fromString(string) {
		if(StringAction.isFingerless(string)) {
			return string;
		}
		let stringParts = string.split(",");
		return new StringAction(
			parseInt(stringParts[0]),
			parseInt(stringParts[1])
		);
	}
}