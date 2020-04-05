class Range {
	constructor(min, max) {
		this.min = min;
		this.max = max;
	}
	
	copy() {
		return new Range(this.min, this.max);
	}
}