class EditableShape extends HTMLFieldSetElement {
	static TAG_NAME = "editable-shape";
	
	constructor(options) {
		super()
		this.initialOptions = {
			shape: options.shape != null ? options.shape : new Shape(),
			saveButton: {
				text: options.saveButton.text ?
					options.saveButton.text :
					"Save",
				callback: options.saveButton.callback
			},
			deleteButton: options.deleteButton ?
				options.deleteButton :
				null
		};
	}
	
	connectedCallback() {
		this.setAttribute("is", EditableShape.TAG_NAME);
		this.initializeHtml();
		this.isOpen = shapeService.isOpenShape(this.initialOptions.shape);
		this.validate();
	}
	
	get shape() {
		return new Shape(this.idShape, this.schema, this.range);
	}
	
	set shape(shape) {
		
		this.shapeChart.shape = shape;
	}
	
	get idShape() {
		return this.dataset.idShape;
	}
	
	get schema() {
		return this.editableSchema.schema;
	}
	
	get minFret() {
		return parseInt(this.minFretInput.value);
	}
	
	set minFret(minFret) {
		this.minFretInput.value = minFret;
		this.minFretChanged();
	}
	
	get maxFret() {
		return parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
	}
	
	get range() {
		return new Range(
			this.minFret,
			this.maxFret
		);
	}
	
	get shapeChart() {
		return this.querySelector("[is='shape-chart']");
	}
	
	get minFretInput() {
		return this.querySelector(".minFretInput");
	}
	
	get maxFretSelect() {
		return this.querySelector(".shapeTypeSelect");
	}
	
	get rRangeLabel() {
		return this.querySelector(".rRangeLabel");
	}
	
	get editableSchema() {
		return this.querySelector("[is='editable-schema']");
	}
	
	get saveButton() {
		return this.querySelector(".editShapeEditButton");
	}
	
	initializeHtml(){
		//Shape chart
		this.append(new ShapeChart({
			shape: this.initialOptions.shape.copy()
		}));
		
		//Min and max fret inputs
		const rangeContainer = document.createElement("div");
		rangeContainer.className = "rangeContainer";
		this.append(rangeContainer);
		//	Min
		const minFretInput = document.createElement("input");
		rangeContainer.append(minFretInput);
		minFretInput.type = "text";
		minFretInput.className = "minFretInput";
		minFretInput.maxLength = Integer.numDigits(Fret.MAX_ROOT);
		minFretInput.onclick = (e) => TextInput.selectAllText(e.target);
		minFretInput.onchange = this.minFretChanged.bind(this);
		minFretInput.value = this.initialOptions.shape.range.min;
		//R range label
		const rRangeLabel = document.createElement("span");
		rangeContainer.append(rRangeLabel);
		rRangeLabel.className = "rRangeLabel";
		rRangeLabel.textContent = " <= r <= ";
		//	Max
		const maxFretInput = document.createElement("input");
		rangeContainer.append(maxFretInput);
		maxFretInput.type = "text";
		maxFretInput.className = "maxFretInput";
		maxFretInput.maxLength = Integer.numDigits(Fret.MAX_ROOT);
		maxFretInput.onclick = (e) => TextInput.selectAllText(e.target);
		maxFretInput.onchange = this.maxFretChanged.bind(this);
		maxFretInput.value = this.initialOptions.shape.range.max;
		
		//Editable schema
		const editableSchema = new EditableSchema(
			{schema: this.initialOptions.shape.schema}
		);
		this.append(editableSchema);
		editableSchema
			.editableStringActions
			.forEach((editableStringAction, index) => {
				editableStringAction.addEventListener(
					"change",
					this.inputChanged.bind(this)
				);
				editableStringAction.addEventListener(
					"change",
					() => this.fretChanged(index)
				);
				editableStringAction
					.relativeFretSelect
					.addEventListener("change", this.inputChanged.bind(this));
			});
		
		//Buttons
		const buttonContainer = document.createElement("div");
		this.append(buttonContainer);
		buttonContainer.className = "editShapeButtonRow";
		
		//Save button
		const saveButton = document.createElement("button");
		saveButton.type = "button";
		saveButton.className = "editShapeEditButton";
		saveButton.textContent = this.initialOptions.saveButton.text;
		saveButton.onclick = this.initialOptions.saveButton.callback;
		
		//Reset button
		const resetButton = document.createElement("button");
		resetButton.type = "button";
		resetButton.className = "editShapeResetButton";
		resetButton.textContent = "Reset";
		resetButton.onclick = this.resetButtonClicked.bind(this);
		
		if(this.initialOptions.deleteButton) {
			//There is a delete button. Use a two-row button scheme,
			//with the edit button on the top row and the reset and
			//delete buttons on the bottom.
			
			//Top Row
			const topRow = document.createElement("div");
			buttonContainer.append(topRow);
			topRow.className = "editShapeButtonRowTop";
			topRow.append(saveButton);
			
			//Bottom row
			const bottomRow = document.createElement("div");
			buttonContainer.append(bottomRow);
			bottomRow.className = "editShapeButtonRowBottom";
			bottomRow.append(resetButton);
			
			//	Delete button
			const deleteButton = document.createElement("button");
			bottomRow.append(deleteButton);
			deleteButton.type = "button";
			deleteButton.className = "editShapeDeleteButton";
			deleteButton.textContent = "Delete";
			deleteButton.onclick = this.initialOptions.deleteButton.callback;
		} else {
			//There is no delete button. Use a one-row button scheme.
			buttonContainer.append(saveButton);
			buttonContainer.append(resetButton);
		}
	}
	
	minFretChanged() {
		const minFret = parseInt(this.minFretInput.value);
		//Is the new min fret valid?
		if(
			isNaN(minFret) ||
			minFret < OPEN_FRET ||
			minFret > MAX_ROOT_FRET ||
			(minFret === 0 && ! this.isOpen)
		) {
			//No, reset
			minFret = this.shapeChart.shape.range.min;
		} else {
			//Yes, update
			this.shapeChart.shape.range.min = minFret;
			this.updateRRangeLabel();
			this.inputChanged();
		}
		
		this.minFretInput.value = minFret;
	}
	
	maxFretChanged() {
		this.shapeChart.shape.range.max = this.maxFret;
		
		if(this.shapeChart.shape.range.max === OPEN_FRET) {
			//This is an open chord
			this.isOpen = true;
			
		} else {
			//This is a movable chord
			this.isOpen = false;
			//Set the min fret to the input value
			this.shapeChart.shape.range.min = parseInt(this.minFretInput.value);
		}
		
		this.updateRRangeLabel();
		for(let i = 0; i < NUM_STRINGS; ++i) {
			this.fretChanged(i);
		}
		this.inputChanged();
	}
	
	fretChanged(stringIndex) {
		const editableSchema = this.editableSchema;
		editableSchema
			.editableStringActions[stringIndex]
			.fingerSelect
			.disabled = StringAction.isFingerless(
				editableSchema
					.editableStringActions[stringIndex]
					.fret
			);
	}
	
	inputChanged() {
		this.updateShape();
		this.validate();
		this.shapeChart.render();
	}
	
	resetButtonClicked() {
		this.reset();
	}
	
	reset() {
		//TODO - this.shape = this.initialOptions.shape
		this.validate();
		this.maxFretSelect.focus();
		this.shapeChart.reset();
	}
	
	updateShape() {
	}
	
	getFixedMin() {
		return this.shapeChart.shape.range.min === MAX_ROOT_FRET ?
			MAX_ROOT_FRET :
			this.isOpen ? OPEN_FRET : null;
	}
	
	validate() {
		const validationResult = shapeService.validate(
			this.shapeChart.shape,
			this.initialOptions.shape.id
		);
		if(validationResult === true) {
			this.dataset.isValid = true;
			this.saveButton.title = "";
			this.saveButton.disabled = false;
		} else {
			this.dataset.isValid = false;
			this.saveButton.title = validationResult;
			this.saveButton.disabled = true;
		}
	}
}

customElements.define(
	EditableShape.TAG_NAME,
	EditableShape,
	{extends: "fieldset"}
);