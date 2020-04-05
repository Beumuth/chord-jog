class EditableSchema extends HTMLFieldsetElement {
	static TAG_NAME = "editable-schema";
	
	constructor(options) {
		super();
		this.initialOptions = {
			schema: options.schema != null ?
				options.schema :
				Schema.allDeadStrings()
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", EditableSchema.TAG_NAME);
		this.style.listStyleType = "none";
		this.style.margin = 0;
		this.style.padding = 0;
		STRING_NAMES
			.forEach((name, index) => {
				const editableStringAction = new EditableStringAction({
					string: index,
					label: name,
					fret: this.initialOptions.strings[index].fret,
					finger: this.initialOptions.strings[index].finger
				});
				this.append(editableStringAction);
				
				//Add -1 margin right to all editable-strings except the last
				if(index !== STRING_NAMES.length - 1) {
					editableStringAction.style.marginRight = -1;
				}
			});
	}
	
	get editableStringActions() {
		return Array.from(
			this.querySelectorAll(
				"[is='" + EditableStringAction.TAG_NAME + "']"
			).values()
		);
	}
	
	get schema() {
		return this.editableStringActions.map(editableStringAction =>
			editableStringAction.stringAction
		);
	}
	
	set schema(shema) {
		this.editableStringActions.forEach((editableStringAction, index) =>
			editableStringAction.stringAction = schema[i]
		);
	}
}

customElements.define(
	EditableSchema.TAG_NAME,
	EditableSchema,
	{extends: "fieldset"}
);