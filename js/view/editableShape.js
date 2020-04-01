class EditableShape extends HTMLFormElement {
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
		this.initializeHtml();
		this.initialize();
		this.validate();
	}
	
	get shapeChart() {
		return $(this).find("[is='shape-chart']").get(0);
	}
	
	get minFretSelect() {
		return getElementsByClassName("minFretInput").get(0);
	}
	
	get maxFretSelect() {
		return getElementsByClassName("shapeTypeSelect")[0];
	}
	
	get rRangeLabel() {
		return getElementsByClassName("rRangeLabel")[0];
	}
	
	get editableShapeStrings() {
		return $(this).find("[is='editable-shape-strings']").get(0);
	}
	
	initializeHtml(){
		//Shape chart
		this.append(new ShapeChart({
			shape: this.initialOptions.shape.copy()
		}));
		
		//Min and max fret inputs
		let rangeContainer = document.createElement("div");
		rangeContainer.className = "rangeContainer";
		this.append(rangeContainer);
		//	Max
		//		Select
		let maxFretSelect = document.createElement("select");
		maxFretSelect.className = "shapeTypeSelect";
		maxFretSelect.classList.add("enumSelect");
		maxFretSelect.onchange = this.maxFretChanged.bind(this);
		rangeContainer.append(maxFretSelect);
		//		Open fret option
		let openFretOption = document.createElement("option");
		openFretOption.className = "maxFretOpenOption";
		openFretOption.value = 0;
		openFretOption.textContent = "Open";
		maxFretSelect.append(openFretOption);
		//		Max root fret option
		let maxRootFretOption = document.createElement("option");
		maxRootFretOption.className = "maxFretMaxRootOption";
		maxRootFretOption.value = 11;
		maxRootFretOption.textContent = "Movable";
		maxFretSelect.append(maxRootFretOption);
		//		Selected index
		maxFretSelect.selectedIndex = shapeService.isOpenShape(this.initialShape) ?
			1 : 0;
		//	Min
		//		Container
		let minFretContainer = document.createElement("div");
		minFretContainer.className = "minFretContainer";
		minFretContainer.classList.add("rangeSubcontainer");
		rangeContainer.append(minFretContainer);
		//		Input
		let minFretInput = document.createElement("input");
		minFretInput.type = "text";
		minFretInput.className = "minFretInput";
		minFretInput.maxLength = 2;
		minFretInput.onclick = minFretClicked.bind(this);
		minFretInput.onchange = minFretChanged.bind(this);
		minFretContainer.append(this.minFretInput);
		
		//R range label
		let rRangeLabel = document.createElement("span");
		rRangeLabel.className = "rRangeLabel";
		minFretContainer.append(rRangeLabel);
		
		//Editable shape strings
		let editableShapeStrings = new EditableShapeStrings();
		Integer
			.range(0, NUM_STRINGS)
			.forEach(string => {
				let editableShapeString = editableShapeStrings.strings[i];
				editableShapeString
					.fingerSelect
					.addEventListener("change", this.inputChanged.bind(this));
				editableShapeString
					.relativeFretSelect
					.addEventListener("change", () => this.fretChanged(i));
				editableShapeString
					.relativeFretSelect
					.addEventListener("change", this.inputChanged.bind(this));
			});
		this.append(editableShapeStrings);
		
		//Buttons
		let buttonContainer = document.createElement("div");
		buttonContainer.className = "editShapeButtonRow";
		this.append(buttonContainer);
		
		//Save button
		let saveButton = document.createElement("button");
		saveButton.type = "button";
		saveButton.className = "editShapeEditButton";
		saveButton.textContent = this.initialOptions.saveButton.text;
		saveButton.onclick = this.initialOptions.saveButton.callback;
		
		//Reset button
		let resetButton = document.createElement("button");
		resetButton.type = "button";
		resetButton.className = "editShapeResetButton";
		resetButton.textContent = "Reset";
		resetButton.onclick = this.resetButtonClicked.bind(this);
		
		if(this.initialOptions.deleteButton) {
			//There is a delete button. Use a two-row button scheme,
			//with the edit button on the top row and the reset and
			//delete buttons on the bottom.
			
			//Top Row
			let topRow = document.createElement("div");
			topRow.className = "editShapeButtonRowTop";
			buttonContainer.append(topRow);
			topRow.append(saveButton);
			
			//Bottom row
			let bottomRow = document.createElement("div");
			bottomRow.className = "editShapeButtonRowBottom";
			buttonContainer.append(bottomRow);
			bottomRow.append(resetButton);
			
			//	Delete button
			let deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.className = "editShapeDeleteButton";
			deleteButton.textContent = "Delete";
			deleteButton.onclick = this.initialOptions.deleteButton.callback;
			bottomRow.append(deleteButton);
		} else {
			//There is no delete button. Use a one-row button scheme.
			buttonContainer.append(saveButton);
			buttonContainer.append(resetButton);
		}
	}
	
	initialize() {
		//If 'Open' is selected, minFretInput is hidden;
		//OPEN_FRET is invalid if 'Movable' is selected;
		//therefore, minFretInput's minimum value is OPEN_FRET + 1.
		this.minFretInput.value = this.initialShape.range.min === OPEN_FRET ?
			OPEN_FRET + 1 : this.initialShape.range.min;
		this.updateRRangeLabel();
		for(let i = 0; i < NUM_STRINGS; ++i) {
			let stringAction = this.initialShape.strings[i];
			$(
				this
					.shapeStringActionViews
					.strings[i]
					.fingerSelect
			).val(stringAction.finger === null ? "null" : stringAction.finger);
			this
				.shapeStringActionViews
				.strings[i]
				.fingerSelect
				.finger = stringAction.finger;
			this
				.shapeStringActionViews
				.strings[i]
				.relativeFretSelect
				.fret = stringAction.fret;
			this.fretChanged(i);
		}
		this.maxFretChanged();
	}
	
	maxFretChanged() {
		this.shapeChartView.shape.range.max = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		
		if(this.shapeChartView.shape.range.max === OPEN_FRET) {
			//This is an open chord
			this.dataset.isOpen = 'true';
			//Set the min fret to 0
			this.shapeChartView.shape.range.min = OPEN_FRET;
			
		} else {
			//This is a movable chord
			this.dataset.isOpen = 'false';
			//Set the min fret to the input value
			this.shapeChartView.shape.range.min = parseInt(this.minFretInput.value);
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
		let minFret = parseInt(this.minFretInput.value);
		//Is the new min fret valid?
		if(
			isNaN(minFret) ||
			minFret < OPEN_FRET ||
			minFret > MAX_ROOT_FRET ||
			(
				minFret === 0 &&
				! this.isOpenSelected()
			)
		) {
			//No, reset
			minFret = this.shapeChartView.shape.range.min;
		} else {
			//Yes, update
			this.shapeChartView.shape.range.min = minFret;
			this.updateRRangeLabel();
			this.inputChanged();
		}
		
		this.minFretInput.value = minFret;
	}
	
	updateRRangeLabel() {
		this.rRangeLabel.textContent =
			shapeService.isOpenShape(this.shapeChartView.shape) ?
				"r = 0" :
				" <= r <= " + MAX_ROOT_FRET;
	}
	
	fretChanged(stringIndex) {
		let fret = this
			.shapeStringActionViews
			.strings[stringIndex]
			.relativeFretSelect
			.fret;
		let isFingerless =
			fret === null ||
			fret === ROOT_FRET && this.isOpenSelected();
		this
			.shapeStringActionViews
			.strings[stringIndex]
			.fingerSelect
			.disabled = isFingerless;
	}
	
	inputChanged() {
		this.updateShape();
		this.validate();
		this.shapeChartView.render();
	}
	
	resetButtonClicked() {
		this.reset();
	}
	
	reset() {
		this.shapeChartView.shape = this.initialShape.copy();
		this.initialize();
		this.validate();
		this.maxFretSelect.focus();
		this.shapeChartView.render();
	}
	
	updateShape() {
		let maxFret = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		let isOpenShape = this.dataset.isOpen === "true";
		this.shapeChartView.shape = new Shape(
			this.initialShape.id,
			this
				.shapeStringActionViews
				.strings
				.map(stringActionViews => {
					let finger = stringActionViews.fingerSelect.finger;
					let fret = stringActionViews.relativeFretSelect.fret;
					//If open shape and open fret, force the finger to null
					return StringAction.WithFretAndFinger(
						fret,
						fret === DEAD_STRING ||
						(isOpenShape && fret === ROOT_FRET) ?
							null :
							finger,
					);
				}),
			new Range(
				maxFret === OPEN_FRET ?
					OPEN_FRET :
					parseInt(this.minFretInput.value),
				maxFret
			)
		);
		this.shapeChartView.fixedMin = this.getFixedMin();
	}
	
	getFixedMin() {
		if(this.shapeChartView.shape.range.min === MAX_ROOT_FRET) {
			return MAX_ROOT_FRET;
		}
		if(shapeService.isOpenShape(this.shapeChartView.shape)) {
			return OPEN_FRET;
		}
		return null;
	}
	
	validate() {
		let validationResult = shapeService.validate(
			this.shapeChartView.shape,
			this.initialShape.id
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
	
	isOpenSelected() {
		return this.dataset.isOpen === "true";
	}
}

customElements.define(
	"editable-shape",
	EditableShape,
	{extends: "form"}
);