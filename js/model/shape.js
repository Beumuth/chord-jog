const NUM_STRINGS = 6;
const OPEN_FRET = 0;
const ROOT_FRET = 0;
const ANY_FRET = "*";
const DEAD_STRING = "x";
const MAX_SHAPE_RANGE = 5;	//Frets 0, 1, 2, 3, 4
const MAX_FRET = MAX_ROOT_FRET + MAX_SHAPE_RANGE;
const STRING_NAMES = new Array("E", "A", "D", "G", "B", "e");

class Shape {
	static STRINGS = [0, 1, 2, 3, 4, 5];

	constructor(
		id=null,
		schema=Schema.allDeadStrings(),
		range=new Range(Range.MIN_ROOT_FRET,)
	) {
		this.id = id;
		this.schema = schema;
		this.range = range;
	}
	
	copy() {
		return new Shape(
			this.id,
			this.strings.map(StringAction.copy),
			this.range.copy()
		);
	}
}