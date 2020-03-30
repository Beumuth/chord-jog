const NUM_STRINGS = 6;
const OPEN_FRET = 0;
const ROOT_FRET = 0;
const ANY_FRET = "*";
const DEAD_STRING = null;
const NO_FINGER = null;
const MAX_ROOT_FRET = 11;
const MAX_SHAPE_RANGE = 5;	//Frets 0, 1, 2, 3, 4
const MAX_FRET = MAX_ROOT_FRET + MAX_SHAPE_RANGE;
const STRING_NAMES = new Array("E", "A", "D", "G", "B", "e");
const FINGERS = new Array(0, 1, 2, 3, 4);

class Shape {
	constructor(
		id=null,
		strings=Shape.AllDeadStrings(),
		range=Range.DefaultForMovableChord()
	) {
		this.id = id;
		this.strings = strings;
		this.range = range;
	}
	
	copy() {
		return new Shape(
			this.id,
			this.strings.map(stringAction => stringAction.copy()),
			this.range.copy()
		);
	}
	
	static AllDeadStrings() {
		return new Array(
			StringAction.DeadString(),
			StringAction.DeadString(),
			StringAction.DeadString(),
			StringAction.DeadString(),
			StringAction.DeadString(),
			StringAction.DeadString()
		);
	}
}