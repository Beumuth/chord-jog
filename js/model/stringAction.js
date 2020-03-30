class StringAction {
	constructor(fret=null, finger=null) {
		this.fret = fret;
		this.finger = finger;
	}
	
	static DeadString() {
		return new StringAction(null, null);
	}
	
	static OpenString() {
		return new StringAction(0, null);
	}
	
	static WithFretAndFinger(fret, finger) {
		return new StringAction(fret, finger);
	}
	
	copy() {
		return new StringAction(this.fret, this.finger);
	}
	
	equals(other) {
		return this.fret === other.fret && this.finger === other.finger;
	}
}