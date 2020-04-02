class EditableShape extends HTMLFieldSetElement {
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
		this.setAttribute("is", "editable-shape");
		this.initializeHtml();
		this.isOpen = shapeService.isOpenShape(this.initialOptions.shape);
		this.validate();
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
	
	get editableShapeStrings() {
		return this.querySelector("[is='editable-shape-strings']");
	}
	
	get saveButton() {
		return this.querySelector(".editShapeEditButton");
	}
	
	get isOpen() {
		return this.dataset.isOpen;
	}
	
	set isOpen(isOpen) {
		this.dataset.isOpen = isOpen;
		this.shapeChart.fixedMin = isOpen ? OPEN_FRET : null;
		this.maxFretSelect.selectedIndex = isOpen ? 0 : 1;
		this.updateRRangeLabel();
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
		//	Max
		//		Select
		const maxFretSelect = document.createElement("select");
		rangeContainer.append(maxFretSelect);
		maxFretSelect.className = "shapeTypeSelect";
		maxFretSelect.classList.add("enumSelect");
		maxFretSelect.onchange = this.maxFretChanged.bind(this);
		//		Open fret option
		const openFretOption = document.createElement("option");
		maxFretSelect.append(openFretOption);
		openFretOption.className = "maxFretOpenOption";
		openFretOption.value = 0;
		openFretOption.textContent = "Open";
		//		Max root fret option
		const maxRootFretOption = document.createElement("option");
		maxFretSelect.append(maxRootFretOption);
		maxRootFretOption.className = "maxFretMaxRootOption";
		maxRootFretOption.value = 11;
		maxRootFretOption.textContent = "Movable";
		//	Min
		//		Container
		const minFretContainer = document.createElement("div");
		rangeContainer.append(minFretContainer);
		minFretContainer.className = "minFretContainer";
		minFretContainer.classList.add("rangeSubcontainer");
		//		Input
		const minFretInput = document.createElement("input");
		minFretContainer.append(minFretInput);
		minFretInput.type = "text";
		minFretInput.className = "minFretInput";
		minFretInput.maxLength = 2;
		minFretInput.onclick = this.minFretClicked.bind(this);
		minFretInput.onchange = this.minFretChanged.bind(this);
		minFretInput.value = this.initialOptions.shape.range.min;
		
		//R range label
		const rRangeLabel = document.createElement("span");
		minFretContainer.append(rRangeLabel);
		rRangeLabel.className = "rRangeLabel";
		
		//Editable shape strings
		const editableShapeStrings = new EditableShapeStrings(
			{strings: this.initialOptions.shape.strings}
		);
		this.append(editableShapeStrings);
		Integer
			.range(0, NUM_STRINGS)
			.forEach(string => {
				const editableShapeString = editableShapeStrings.strings[string];
				editableShapeString.addEventListener(
					"change",
					this.inputChanged.bind(this)
				);
				editableShapeString.addEventListener(
					"change",
					() =>this.fretChanged(string)
				);
				editableShapeString
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
	
	maxFretChanged() {
		this.shapeChart.shape.range.max = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		
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
	
	minFretClicked() {
		this.minFretInput.setSelectionRange(0, this.minFretInput.value.length);
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
	
	updateRRangeLabel() {
		this.rRangeLabel.textContent =
			shapeService.isOpenShape(this.shapeChart.shape) ?
				"r = 0" :
				" <= r <= " + MAX_ROOT_FRET;
	}
	
	fretChanged(stringIndex) {
		let editableShapeStrings = this.editableShapeStrings;
		const fret = editableShapeStrings
			.strings[stringIndex]
			.relativeFretSelect
			.fret;
		const isFingerless =
			fret === DEAD_STRING ||
			fret === ROOT_FRET && this.isOpen;
		editableShapeStrings
			.strings[stringIndex]
			.fingerSelect
			.disabled = isFingerless;
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
		const maxFret = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		this.shapeChart.shape = new Shape(
			this.initialOptions.shape.id,
			this
				.editableShapeStrings
				.strings
				.map(editableString => {
					const fret = editableString.relativeFretSelect.fret;
					const finger = editableString.fingerSelect.finger;
					//If open shape and open fret, force the finger to null
					return StringAction.withFretAndFinger(
						fret,
						fret === DEAD_STRING ||
						(this.isOpen && fret === ROOT_FRET) ?
							Finger.NO_FINGER :
							finger
					);
				}),
			new Range(
				maxFret === OPEN_FRET ?
					OPEN_FRET :
					parseInt(this.minFretInput.value),
				maxFret
			)
		);
		this.shapeChart.fixedMin = this.getFixedMin();
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
	"editable-shape",
	EditableShape,
	{extends: "fieldset"}
);