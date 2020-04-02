class FingerAction {
	static TYPE_SINGLE = "single";
	static TYPE_BAR = "bar";
	
	static single(finger, fret, string) {
		return {
			finger: finger,
			fret: fret,
			string: string
		};
	}
	
	static bar(finger, fret, minString, maxString) {
		return {
			finger: finger,
			fret: fret,
			bar: {
				min: minString,
				max: maxString
			}
		};
	}
	
	static type(fingerAction) {
		return fingerAction.string !== undefined ?
			FingerAction.TYPE_SINGLE :
			FingerActions.TYPE_BAR;
	}
}

class FingerActions {	
	static getSingleFingerOnFret(fingerActions, finger, fret) {
		return fingerActions.find(fingerAction =>
			FingerAction.type(fingerAction) === FingerAction.TYPE_SINGLE &&
			fingerAction.finger === finger &&
			fingerAction.fret === fret
		);
	}
	
	static getFingerBarOnFret(fingerActions, finger, fret) {
		return fingerActions.find(fingerAction =>
			FingerAction.type(fingerAction) === FingerAction.TYPE_BAR &&
			fingerAction.finger === finger &&
			fingerAction.fret === fret
		);
	}
	
	static withFinger(fingerActions, finger){
		return fingerActions.filter(fingerAction =>
			fingerAction.finger === finger
		);
	}
}