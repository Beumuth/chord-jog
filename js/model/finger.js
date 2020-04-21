class Finger {
	static UNKNOWN = '?';
	static ANY = "*";
	static NONE = "x";
	static THUMB = 'T';
	static INDEX = "1";
	static MIDDLE = "2";
	static RING = "3";
	static PINKY = "4";
	
	static fromString(finger) {
		return isNaN(finger) ? finger : parseInt(finger);
	}
	
	static toString(finger) {
		return finger + "";
	}
}

class Fingers {
	static FINGERFUL = [
		Finger.THUMB,
		Finger.INDEX,
		Finger.MIDDLE,
		Finger.RING,
		Finger.PINKY
	];
}