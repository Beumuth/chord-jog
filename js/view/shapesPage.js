class ShapesPage extends Page {
	constructor() {
		
	}
	
	onPageLoad() {
		pageView.render("Shapes");
		
		//Container
		this.container = document.createElement("div");
		this.container.className = "manageShapesContainer";
		this.container.classList.add("sectionContainer");
		pageView.container.append(this.container);
		
		this.createImportExportView();
		this.createShapesEditor();
		this.createShapeCreator();
	}
	
	createImportExportView() {
		//Container
		this.importExportContainer = document.createElement("div");
		this.importExportContainer.className = "importExportContainer";
		this.importExportContainer.classList.add("sectionContainer");
		this.importExportContainer.dataset.border = "none";
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
		inputLabel.className = "buttonInput";
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
	
	createShapesEditor() {
		this.shapesEditor = new ShapesEditorView();
		this.container.append(this.shapesEditor.container);
	}
	
	createShapeCreator() {
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
		this.shapesEditor.displaySingleResult(shape);
		this.addShapeView.maxFretSelect.focus();
	}
	
	importShapes() {
		if(this.importInput.files.length > 0) {
			shapeService.importShapes(this.importInput.files);
			this.shapesEditor.reset();
		}
	}
	
	overwriteShapes() {
		if(this.overwriteInput.files.length > 0) {
			shapeService.overwriteShapes(this.overwriteInput.files);
			this.shapesEditor.reset();
		}
	}
	
	downloadShapes() {
		shapeService.redirectToShapesFile();
	}
}

const shapesPage = new ShapesPage();