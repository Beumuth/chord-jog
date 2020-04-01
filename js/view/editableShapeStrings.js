class EditableShapeStrings extends HTMLOListElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		this.setAttribute("is", "editable-shape-strings");
		this.style.listStyleType = "none";
		this.style.margin = 0;
		this.style.padding = 0;
		STRING_NAMES
			.map((name, index) => {
				const editableShapeString = new EditableShapeString({
					string: index,
					label: name
				});
				
				//Add -1 margin right to all editable-strings except the last
				if(index !== STRING_NAMES.length - 1) {
					editableShapeString.style.marginRight = -1;
				}
				return editableShapeString;
			})
			.forEach(editableShapeString => this.append(editableShapeString));
	}
	
	get strings() {
		return $(this).find("[is='editable-shape-string']").get();
	}
}

customElements.define(
	"editable-shape-strings",
	EditableShapeStrings,
	{extends: "ol"}
);