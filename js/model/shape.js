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
	constructor(id=null, schema=null, range=null) {
		this.id = id;
		this.schema = schema != null ?
			schema :
			new Array(
				new Array(null, null),	//E
				new Array(null, null),	//A
				new Array(null, null),	//D
				new Array(null, null),	//G
				new Array(null, null),	//B
				new Array(null, null),	//e
			);
		this.range = range != null ?
			range :
			new Array(OPEN_FRET+1, MAX_ROOT_FRET);
	}
	
	copy() {
		return new Shape(
			this.id,
			this.schema.map(stringAction =>
				new Array(stringAction[0], stringAction[1])
			),
			new Array(this.range[0], this.range[1])
		);
	}
}