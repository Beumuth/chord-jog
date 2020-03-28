class EditableShapeView {
	constructor(options = {}) {
		this.initialShape = options.shape != null ? options.shape : new Shape();
		this.initializeHtml(options);
		this.initialize();
		this.validate();
	}
	
	initializeHtml(options){	
		//Container
		this.container = document.createElement("div");
		this.container.className = "editableShapeView";
		
		//Shape chart
		this.shapeChartView = new ShapeChartView(this.initialShape.copy());
		this.container.append(this.shapeChartView.container);
		
		//Min and max fret inputs
		let rangeContainer = document.createElement("div");
		rangeContainer.className = "rangeContainer";
		this.container.append(rangeContainer);
		//	Max
		//		Select
		this.maxFretSelect = document.createElement("select");
		this.maxFretSelect.className = "shapeTypeSelect";
		this.maxFretSelect.onchange = this.maxFretChanged.bind(this);
		rangeContainer.append(this.maxFretSelect);
		//		Open fret option
		let openFretOption = document.createElement("option");
		openFretOption.className = "maxFretOpenOption";
		openFretOption.value = 0;
		openFretOption.textContent = "Open";
		this.maxFretSelect.append(openFretOption);
		//		Max root fret option
		let maxRootFretOption = document.createElement("option");
		maxRootFretOption.className = "maxFretMaxRootOption";
		maxRootFretOption.value = 11;
		maxRootFretOption.textContent = "Movable";
		this.maxFretSelect.append(maxRootFretOption);
		//	Min
		//		Container
		let minFretContainer = document.createElement("div");
		minFretContainer.className = "minFretContainer";
		minFretContainer.classList.add("rangeSubcontainer");
		rangeContainer.append(minFretContainer);
		//		Input
		this.minFretInput = document.createElement("input");
		this.minFretInput.type = "text";
		this.minFretInput.className = "minFretInput";
		this.minFretInput.maxLength = 2;
		this.minFretInput.onclick = this.minFretClicked.bind(this);
		this.minFretInput.onchange = this.minFretChanged.bind(this);
		minFretContainer.append(this.minFretInput);
		
		//R range label
		this.rRangeLabel = document.createElement("span");
		this.rRangeLabel.className = "rRangeLabel";
		minFretContainer.append(this.rRangeLabel);
		
		//Controls table
		this.shapeStringActionViews = new EditableShapeStringActionViews();
		for(let i = 0; i < this.shapeStringActionViews.strings.length; ++i) {
			let stringActionViews = this.shapeStringActionViews.strings[i];
			stringActionViews
				.fingerSelectView
				.fingerSelect
				.addEventListener("change", this.inputChanged.bind(this));
			stringActionViews
				.relativeFretSelectView
				.fretSelect
				.addEventListener("change", () => this.fretChanged(i));
			stringActionViews
				.relativeFretSelectView
				.fretSelect
				.addEventListener("change", this.inputChanged.bind(this));
		}
		
		//Table
		this.controlsContainer = document.createElement("table");
		this.controlsContainer.className = "editShapeControlsContainer";
		this.container.append(this.controlsContainer);
		
		//Rows
		let labelRow = document.createElement("tr");
		let fretRow = document.createElement("tr");
		let fingerRow = document.createElement("tr");
		this.controlsContainer.append(labelRow);
		this.controlsContainer.append(fretRow);
		this.controlsContainer.append(fingerRow);
		
		//Columns
		for(let i = 0; i < this.shapeStringActionViews.strings.length; ++i) {
			//Label cell
			let labelCell = document.createElement("th");
			labelCell.append(
				this
					.shapeStringActionViews
					.strings[i]
					.label
			);
			labelRow.append(labelCell);
			
			//Fret cell
			let fretCell = document.createElement("td");
			fretCell.append(
				this
					.shapeStringActionViews
					.strings[i]
					.relativeFretSelectView
					.fretSelect
			);
			fretRow.append(fretCell);
			
			//Finger cell
			let fingerCell = document.createElement("td");
			fingerCell.append(
				this
					.shapeStringActionViews
					.strings[i]
					.fingerSelectView
					.fingerSelect
			);
			fingerRow.append(fingerCell);
		}
		
		//Buttons
		let buttonContainer = document.createElement("div");
		buttonContainer.className = "editShapeButtonRow";
		this.container.append(buttonContainer);
		
		//Save button
		this.saveButton = document.createElement("button");
		this.saveButton.type = "button";
		this.saveButton.className = "editShapeEditButton";
		this.saveButton.textContent = options.saveButtonText !== undefined ?
			options.saveButtonText :
			"Save";
		this.saveButton.onclick = options.saveButtonHandler;
		
		//Reset button
		this.resetButton = document.createElement("button");
		this.resetButton.type = "button";
		this.resetButton.className = "editShapeResetButton";
		this.resetButton.textContent = "Reset";
		this.resetButton.onclick = this.resetButtonClicked.bind(this);
		
		if(options.includesDeleteButton === true) {
			//There is a delete button. Use a two-row button scheme,
			//with the edit button on the top row and the reset and
			//delete buttons on the bottom.
			
			//Top Row
			let topRow = document.createElement("div");
			topRow.className = "editShapeButtonRowTop";
			buttonContainer.append(topRow);
			topRow.append(this.saveButton);
			
			//Bottom row
			let bottomRow = document.createElement("div");
			bottomRow.className = "editShapeButtonRowBottom";
			buttonContainer.append(bottomRow);
			bottomRow.append(this.resetButton);
			
			//	Delete button
			this.deleteButton = document.createElement("button");
			this.deleteButton.type = "button";
			this.deleteButton.className = "editShapeDeleteButton";
			this.deleteButton.textContent = "Delete";
			this.deleteButton.onclick = options.deleteButtonHandler;
			bottomRow.append(this.deleteButton);
		} else {
			//There is no delete button. Use a one-row button scheme.
			buttonContainer.append(this.saveButton);
			buttonContainer.append(this.resetButton);
		}
	}
	
	initialize() {
		this.container.dataset.isOpen = 
			shapeService.isOpenShape(this.initialShape) ? 'true' : 'false';
		this.maxFretSelect.selectedIndex =
			shapeService.isOpenShape(this.initialShape) ? 0 : 1;
			
		//If 'Open' is selected, minFretInput is hidden;
		//OPEN_FRET is invalid if 'Movable' is selected;
		//therefore, minFretInput's minimum value is OPEN_FRET + 1.
		this.minFretInput.value = this.initialShape.range[0] === OPEN_FRET ?
			OPEN_FRET + 1 : this.initialShape.range[0];
		this.updateRRangeLabel();
		for(let i = 0; i < NUM_STRINGS; ++i) {
			let finger = this.initialShape.schema[i][0];
			$(
				this
					.shapeStringActionViews
					.strings[i]
					.fingerSelectView
					.fingerSelect
			).val(finger === null ? "null" : finger);
			this.shapeStringActionViews.strings[i].fingerSelectView.finger = finger;
			
			let fret = this.initialShape.schema[i][1];
			$(
				this
					.shapeStringActionViews
					.strings[i]
					.relativeFretSelectView
					.fretSelect
			).val(fret === null ? "null" : fret);
			this.shapeStringActionViews.strings[i].relativeFretSelectView.fret = fret;
			this.fretChanged(i);
		}
		this.maxFretChanged();
	}
	
	maxFretChanged() {
		this.shapeChartView.shape.range[1] = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		
		if(this.shapeChartView.shape.range[1] === OPEN_FRET) {
			//This is an open chord
			this.container.dataset.isOpen = 'true';
			//Set the min fret to 0
			this.shapeChartView.shape.range[0] = OPEN_FRET;
			
		} else {
			//This is a movable chord
			this.container.dataset.isOpen = 'false';
			//Set the min fret to the input value
			this.shapeChartView.shape.range[0] = parseInt(this.minFretInput.value);
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
			minFret = this.shapeChartView.shape.range[0];
		} else {
			//Yes, update
			this.shapeChartView.shape.range[0] = minFret;
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
			.relativeFretSelectView
			.fret;
		let isFingerless =
			fret === null ||
			fret === ROOT_FRET && this.isOpenSelected();
		this
			.shapeStringActionViews
			.strings[stringIndex]
			.fingerSelectView
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
		this.shapeChartView.render();
	}
	
	updateShape() {
		let maxFret = parseInt(
			this.maxFretSelect.options[
				this.maxFretSelect.selectedIndex
			].value
		);
		let isOpenShape = this.container.dataset.isOpen === "true";
		this.shapeChartView.shape = new Shape(
			this.initialShape.id,
			this
				.shapeStringActionViews
				.strings
				.map(stringActionViews => {
					let finger = stringActionViews.fingerSelectView.finger;
					let fret = stringActionViews.relativeFretSelectView.fret;
					
					//If open shape and open fret, force the finger to null
					return new Array(
						fret === DEAD_STRING ||
						(isOpenShape && fret === ROOT_FRET) ?
							null :
							finger,
						fret
					);
				}),
			new Array(
				maxFret === OPEN_FRET ?
					OPEN_FRET :
					parseInt(this.minFretInput.value),
				maxFret
			)
		);
		this.shapeChartView.fixedMin = this.getFixedMin();
	}
	
	getFixedMin() {
		if(this.shapeChartView.shape.range[0] === MAX_ROOT_FRET) {
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
			this.container.dataset.isValid = true;
			this.saveButton.title = "";
			this.saveButton.disabled = false;
		} else {
			this.container.dataset.isValid = false;
			this.saveButton.title = validationResult;
			this.saveButton.disabled = true;
		}
	}
	
	isOpenSelected() {
		return this.container.dataset.isOpen === "true";
	}
}