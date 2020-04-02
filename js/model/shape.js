const NUM_STRINGS = 6;
const OPEN_FRET = 0;
const ROOT_FRET = 0;
const ANY_FRET = "*";
const DEAD_STRING = "x";
const MAX_ROOT_FRET = 11;
const MAX_SHAPE_RANGE = 5;	//Frets 0, 1, 2, 3, 4
const MAX_FRET = MAX_ROOT_FRET + MAX_SHAPE_RANGE;
const STRING_NAMES = new Array("E", "A", "D", "G", "B", "e");

class Shape {
	static STRINGS = [0, 1, 2, 3, 4, 5];

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
			this.strings.map(StringAction.copy),
			this.range.copy()
		);
	}
	
	fingerActions() {
		const fingerActions = [];
		Integer
			.range(0, NUM_STRINGS)
			.filter(i => ! StringAction.isFingerless(this.strings[i]))
			.forEach(i => {
				let stringAction = this.strings[i];
				//Is this finger currently barred across this fret?
				let fingerAction = FingerActions.getFingerBarOnFret(
					fingerActions,
					stringAction.finger,
					stringAction.fret
				);
				if(fingerAction !== undefined) {
					//Yes. Update the max string.
					fingerAction.bar.max = i;
				} else {
					//No.
					//Is this finger used on a another string with the same fret?
					fingerAction = FingerActions.getSingleFingerOnFret(
						fingerActions,
						stringAction.finger,
						stringAction.fret
					);
					if(fingerAction !== undefined) {
						//Yes. Convert it to a finger bar.
						fingerActions.splice(
							fingerActions.indexOf(fingerAction),
							1
						);
						fingerActions.push(
							FingerAction.bar(
								stringAction.finger,
								stringAction.fret,
								fingerAction.string,	//minString
								i						//maxString
							)
						);
					} else {
						//No.
						//Add this finger as a single.
						fingerActions.push(
							FingerAction.single(
								stringAction.finger,
								stringAction.fret,
								i
							)
						);
					}
				}
			});
		return fingerActions;
	}
	
	static AllDeadStrings() {
		return Integer
			.range(0, NUM_STRINGS)
			.map(() => (StringAction.DEAD_STRING));
	}
}