class EditableShapeStrings extends HTMLOListElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		STRING_NAMES
			.map((name, index) => new EditableShapeString({
				string: index,
				label: name
			}))
			.forEach(this.append.bind(this));
		this.style.listStyleType = "none";
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