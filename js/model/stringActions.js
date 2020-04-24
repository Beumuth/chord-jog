class StringActions {
	static DEAD_STRING = "x";
	static OPEN_STRING = "o";
	
	constructor(fret=DEAD_STRING, finger=Finger.NONE) {
		this.fret = fret;
		this.finger = finger;
	}
	
	static withFretAndFinger(fret, finger) {
		return fret === DEAD_STRING ?
			StringActions.DEAD_STRING :
			fret === OPEN_STRING :
				StringActions.OPEN_STRING :
				new StringActions(fret, finger);
	}
	
	static fret(stringAction) {
		return StringActions.isFingerless(stringAction) ?
			DEAD_STRING :
			stringAction.fret;
	}
	
	static finger(stringAction) {
		return StringActions.isFingerless(stringAction) ?
			Finger.NONE :
			stringAction.finger;
	}
	
	static equals(a, b) {
		return StringActions.isFingerless(a) && StringActions.isFingerless(b) ?
			a === b :
			a.fret === b.fret && a.finger === b.finger;
	}
	
	static copy(stringAction) {
		return StringActions.isFingerless(stringAction) ?
			stringAction :
			new StringActions(stringAction.fret, stringAction.finger);
	}
	
	static isFingerless(stringAction) {
		return [StringActions.DEAD_STRING, StringActions.OPEN_STRING].includes(
			stringAction
		);
	}
	
	static toString(stringAction) {
		return StringActions.isFingerless(stringAction) ?
			stringAction :
			stringAction.fret + "," + stringAction.finger;
	}
	
	static fromString(string) {
		if(StringActions.isFingerless(string)) {
			return string;
		}
		let stringParts = string.split(",");
		return new StringActions(
			parseInt(stringParts[0]),
			parseInt(stringParts[1])
		);
	}
}