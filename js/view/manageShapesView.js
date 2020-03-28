class ManageShapesView {
	constructor() {
	}
	
	onPageLoad() {
		//Container
		this.container = document.createElement("div");
		this.container.className = "manageShapesContainer";
		this.container.classList.add("sectionContainer");
		document.getElementById("container").append(this.container);
		
		//Header
		let header = document.createElement("h2");
		header.className = "sectionHeader";
		header.textContent = "Shapes";
		this.container.append(header);
		
		this.createImportExportView();
		this.createEditShapesView();
		this.createAddShapeView();
	}
	
	createImportExportView() {
		//Container
		this.importExportContainer = document.createElement("div");
		this.importExportContainer.className = "importExportContainer";
		this.importExportContainer.classList.add("sectionContainer");
		this.container.append(this.importExportContainer);
		
		//	Import
		this.importInput = this.createImportExportFileInput(
			"importInput",
			"Import",
			this.importShapes.bind(this)
		);
		//	Overwrite
		this.overwriteInput = this.createImportExportFileInput(
			"overwriteInput",
			"Overwrite",
			this.overwriteShapes.bind(this)
		);
		
		//	Download
		let downloadShapesButton = document.createElement("button");
		downloadShapesButton.type = "button";
		downloadShapesButton.id = "downloadShapesButton";
		downloadShapesButton.className = "importExportInput";
		downloadShapesButton.onclick = this.downloadShapes.bind(this);
		downloadShapesButton.textContent = "Download";
		this.importExportContainer.append(downloadShapesButton);
	}
	
	createImportExportFileInput(id, labelText, changeHandler) {
		let inputLabel = document.createElement("label");
		inputLabel.className = "fileInputLabel";
		inputLabel.setAttribute("for", id);
		inputLabel.textContent = labelText;
		this.importExportContainer.append(inputLabel);
		
		let input = document.createElement("input");
		input.type = "file";
		input.id = id;
		input.name = id;
		input.className = "importExportInput";
		input.accept = ".shapes";
		input.multiple = true;
		input.onchange = changeHandler;
		input.style.opacity = 0;
		this.importExportContainer.append(input);
		
		return input;
	}
	
	createEditShapesView() {
		this.editShapesView = new EditShapesView();
		this.container.append(this.editShapesView.container);
	}
	
	createAddShapeView() {
		//Container
		let addShapeViewContainer = document.createElement("div");
		addShapeViewContainer.id = "addShapeViewContainer";
		addShapeViewContainer.classList.add("sectionContainer");
		this.container.append(addShapeViewContainer);
		
		//Header
		let header = document.createElement("h3");
		header.className = "sectionHeader";
		header.textContent = "Creator";
		addShapeViewContainer.append(header);
		
		//AddShapeView
		this.addShapeView = new EditableShapeView({
			saveButtonHandler: this.addShape.bind(this),
			saveButtonText: "Add"
		});
		addShapeViewContainer.append(this.addShapeView.container);
	}
	
	addShape() {
		let shape = this.addShapeView.shapeChartView.shape;
		shapeService.createShape(shape);
		this.addShapeView.reset();
		this.editShapesView.displaySingleResult(shape);
		this.addShapeView.maxFretSelect.focus();
	}
	
	importShapes() {
		if(this.importInput.files.length > 0) {
			shapeService.importShapes(this.importInput.files);
			this.editShapesView.reset();
		}
	}
	
	overwriteShapes() {
		if(this.overwriteInput.files.length > 0) {
			shapeService.overwriteShapes(this.overwriteInput.files);
			this.editShapesView.reset();
		}
	}
	
	downloadShapes() {
		shapeService.redirectToShapesFile();
	}
}

const manageShapesView = new ManageShapesView();