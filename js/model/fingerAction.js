class FingerAction {
	
	static single(finger, fret, string) {
		return {
			finger: finger,
			fret: fret,
			string: string
		};
	}
	
	static bar(finger, fret, minString, maxString) {
		return {
			fret: fret,
			finger: finger,
			bar: {
				min: minString,
				max: maxString
			}
		};
	}
	
	static type(fingerAction) {
		return fingerAction.string !== undefined ?
			FingerActionType.SINGLE :
			FingerActionType.BAR;
	}
}

class FingerActionType {
	static SINGLE = "fingerActionTypeSingle";
	static BAR = "fingerActionTypeBar";
}

class FingerActions {	
	static getSingleFingerOnFret(fingerActions, finger, fret) {
		return fingerActions.find(fingerAction =>
			FingerAction.type(fingerAction) === FingerActionType.SINGLE &&
			fingerAction.finger === finger &&
			fingerAction.fret === fret
		);
	}
	
	static getFingerBarOnFret(fingerActions, finger, fret) {
		return fingerActions.find(fingerAction =>
			FingerAction.type(fingerAction) === FingerActionType.BAR &&
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