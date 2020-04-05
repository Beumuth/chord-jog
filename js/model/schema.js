class Schema {
	static allDeadStrings() {
		return Integer
			.range(0, NUM_STRINGS)
			.map(() => (StringAction.DEAD_STRING));
	}
	
	static getFingerActions(schema) {
		return schema
			//Filter off fingerless string actions
			.filter(stringAction => ! StringAction.isFingerless(stringAction))
			.reduce(
				(fingerActions, stringAction) => {
					//Is this finger currently barred across this fret?
					let fingerAction = FingerActions.getFingerBarOnFret(
						fingerActions,
						stringAction.finger,
						stringAction.fret
					);
					if(fingerAction !== undefined) {
						//Yes. Update the max string.
						fingerAction.bar.max = string;
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
									string					//maxString
								)
							);
						} else {
							//No.
							//Add this finger as a single.
							fingerActions.push(
								FingerAction.single(
									stringAction.finger,
									stringAction.fret,
									string
								)
							);
						}
					}
				},
				[]
			);
	}
}