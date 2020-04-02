class ShapesPage extends Page {
	constructor() {
		super("Shapes");
	}
	
	connectedCallback() {
		super.connectedCallback();
		
		this.classList.add("sectionContainer");
		this.createImportExportView();
		this.createShapesEditor();
		this.createShapeCreator();
	}
	
	get importExportContainer() {
		return document.getElementsByClassName("importExportContainer")[0];
	}
	
	get importInput() {
		return document.getElementById("importInput");
	}
	
	get overwriteInput() {
		return document.getElementById("overwriteInput");
	}
	
	get shapesEditor() {
		return document.querySelector("[is='shapes-editor']");
	}
	
	get shapeCreator() {
		return document.getElementById("shapeCreator");
	}
	
	createImportExportView() {
		//Container
		const importExportContainer = document.createElement("div");
		this.append(importExportContainer);
		importExportContainer.className = "importExportContainer";
		importExportContainer.classList.add("sectionContainer");
		importExportContainer.dataset.border = "none";
		
		//	Import
		const importInput = this.createImportExportFileInput(
			"importInput",
			"Import",
			this.importShapes.bind(this)
		);
		//	Overwrite
		const overwriteInput = this.createImportExportFileInput(
			"overwriteInput",
			"Overwrite",
			this.overwriteShapes.bind(this)
		);
		
		//	Download
		const downloadShapesButton = document.createElement("button");
		importExportContainer.append(downloadShapesButton);
		downloadShapesButton.type = "button";
		downloadShapesButton.id = "downloadShapesButton";
		downloadShapesButton.className = "importExportInput";
		downloadShapesButton.onclick = this.downloadShapes.bind(this);
		downloadShapesButton.textContent = "Download";
	}
	
	createImportExportFileInput(id, labelText, changeHandler) {
		const inputLabel = document.createElement("label");
		this.importExportContainer.append(inputLabel);
		inputLabel.className = "buttonInput";
		inputLabel.setAttribute("for", id);
		inputLabel.textContent = labelText;
		
		const input = document.createElement("input");
		this.importExportContainer.append(input);
		input.type = "file";
		input.id = id;
		input.name = id;
		input.className = "importExportInput";
		input.accept = ".shapes";
		input.multiple = true;
		input.onchange = changeHandler;
		input.style.opacity = 0;
		
		return input;
	}
	
	createShapesEditor() {
		this.append(new ShapesEditor());
	}
	
	createShapeCreator() {
		//Container
		const shapeCreatorContainer = document.createElement("div");
		this.append(shapeCreatorContainer);
		shapeCreatorContainer.id = "shapeCreatorContainer";
		shapeCreatorContainer.classList.add("sectionContainer");
		
		//Header
		const header = document.createElement("h3");
		shapeCreatorContainer.append(header);
		header.className = "sectionHeader";
		header.textContent = "Creator";
		
		//EditableShape
		const shapeCreator = new EditableShape({
			saveButton: {
				text:"Add",
				callback:this.addShape.bind(this)
			}
		});
		shapeCreatorContainer.append(shapeCreator);
		shapeCreator.id = "shapeCreator";
	}
	
	addShape() {
		const shape = this.shapeCreator.shapeChart.shape;
		shapeService.createShape(shape);
		this.shapeCreator.reset();
		this.shapesEditor.displaySingleResult(shape);
		this.shapeCreator.maxFretSelect.focus();
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
customElements.define(
	"shapes-page",
	ShapesPage,
	{extends: "div"}
);
const shapesPage = new ShapesPage();