class Range {
	constructor(min, max) {
		this.min = min;
		this.max = max;
	}
	
	copy() {
		return new Range(this.min, this.max);
	}
	
	static ForOpenChord() {
		return new Range(OPEN_FRET, OPEN_FRET);
	}
	
	static DefaultForMovableChord() {
		return new Range(OPEN_FRET+1, MAX_ROOT_FRET);
	}
}