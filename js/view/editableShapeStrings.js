class EditableShapeStrings extends HTMLOListElement {
	constructor(options) {
		super();
		this.initialOptions = {
			strings: options.strings != null ?
				options.strings :
				Shape.AllDeadStrings()
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", "editable-shape-strings");
		this.style.listStyleType = "none";
		this.style.margin = 0;
		this.style.padding = 0;
		STRING_NAMES
			.forEach((name, index) => {
				const editableShapeString = new EditableShapeString({
					string: index,
					label: name,
					fret: this.initialOptions.strings[index].fret,
					finger: this.initialOptions.strings[index].finger
				});
				
				//Add -1 margin right to all editable-strings except the last
				if(index !== STRING_NAMES.length - 1) {
					editableShapeString.style.marginRight = -1;
				}
				this.append(editableShapeString);
			});
	}
	
	get strings() {
		return Array.from(
			this.querySelectorAll("[is='editable-shape-string']").values()
		);
	}
	
	set strings(stringActions) {
		let editableShapeStrings = this.strings;
		Integer
			.range(0, NUM_STRINGS)
			.forEach(i => {
				editableShapeStrings[i].finger = stringActions[i].finger;
				editableShapeStrings[i].fret = stringActions[i].fret;
			});
	}
}

customElements.define(
	"editable-shape-strings",
	EditableShapeStrings,
	{extends: "ol"}
);