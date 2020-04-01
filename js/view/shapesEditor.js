class ShapesEditor extends HTMLDivElement {
	constructor() {
		super();
	}
	
	connectedCallback() {
		this.initializeHtml();
	}
	
	get resultsContainer() {
		return this.getElementsByClassName("editShapesResultsContainer")[0];
	}
	
	get resultsList() {
		return this.getElementsByClassName("shapeChartList")[0];
	}
	
	get relativeFretSelects() {
		return $(this).find("[is='relative-fret-select']").get();
	}
	
	get editableShapes() {
		return $(this).find("[is='editable-shape']").get();
	}
	
	initializeHtml() {
		this.classList.add("sectionContainer");
		this.createSearchContainer();
		this.createResultsContainer();
	}
	
	createSearchContainer() {
		//Search container
		const searchContainer = document.createElement("div");
		this.append(searchContainer);
		searchContainer.className = "editShapesSearchContainer";
		searchContainer.classList.add("sectionContainer");
		
		//	Search header
		const header = document.createElement("h3");
		searchContainer.append(header);
		header.className = "sectionHeader";
		header.textContent = "Search";
		
		//	Search table
		const searchTable = document.createElement("table");
		searchContainer.append(searchTable);
		searchTable.className = "searchTable";
		
		//		Header row
		const headerRow = document.createElement("tr");
		searchTable.append(headerRow);
		
		//		Fret inputs row
		const searchFretInputsRow = document.createElement("tr");
		searchTable.append(searchFretInputsRow);
		for(let i = 0; i < NUM_STRINGS; ++i) {
			//		Header cell
			const headerCell = document.createElement("th");
			headerRow.append(headerCell);
			headerCell.textContent = STRING_NAMES[i];
			
			//		Input cell and input
			const inputCell = document.createElement("td");
			const relativeFretSelect = new RelativeFretSelect({
				string: i,
				selectedFret: null,
				includeAnyFret: true
			});
			relativeFretSelect.addEventListener(
				"change",
				this.search.bind(this)
			);
			inputCell.append(relativeFretSelect);
			searchFretInputsRow.append(inputCell);
		}
		
		//	Button container
		const searchButtonContainer = document.createElement("div");
		searchContainer.append(searchButtonContainer);
		searchButtonContainer.className = "searchButtonContainer";
		
		//		Reset button
		const resetButton = document.createElement("button");
		searchButtonContainer.append(resetButton);
		resetButton.type = "button";
		resetButton.className = "searchResetButton";
		resetButton.textContent = "Reset";
		resetButton.onclick = this.reset.bind(this);
	}
	
	createResultsContainer() {
		//Results container
		const resultsContainer = document.createElement("div");
		this.append(resultsContainer);
		resultsContainer.className = "editShapesResultsContainer";
		resultsContainer.classList.add("sectionContainer");
		resultsContainer.dataset.isEmpty = "true";
		
		//	Results header
		const resultsHeader = document.createElement("h3");
		resultsContainer.append(resultsHeader);
		resultsHeader.className = "sectionHeader";
		resultsHeader.textContent = "Editor";
		
		//	'Search for a shape' message
		const searchForShape = document.createElement("span");
		resultsContainer.append(searchForShape);
		searchForShape.className = "editShapesSearchForShapeMessage";
		searchForShape.textContent = "Search for a shape to edit";
		
		//	Results list
		const resultsList = document.createElement("ul");
		resultsContainer.append(resultsList);
		resultsList.className = "shapeChartList";
	}
	
	search() {
		this.clearResults();
		const search = this.relativeFretSelects.map(fretSelect => fretSelect.fret);
		if(
			! search
				.map(string => string === ANY_FRET)
				.reduce((areAllAnyFret, isStringAnyFret) =>
					areAllAnyFret && isStringAnyFret
				)
		) {
			//The search is not all ANY_FRETs
			//Get matches
			const matches = shapeService.searchShapesWithFrets(search);
			
			this.resultsContainer.dataset.isEmpty = matches.length === 0;
			
			//Iterate through matches
			matches.forEach(this.addResult.bind(this));
		}
	}
	
	displaySingleResult(shape) {
		this.clearResults();
		const relativeFretSelects = this.relativeFretSelects;
		shape.strings.forEach((stringAction, string) =>
			relativeFretSelects[string].fret = stringAction.fret
		);
		this.addResult(shape);
		this.resultsContainer.dataset.isEmpty = false;
	}
	
	addResult(shape) {
		//List item
		const listItem = this.shapeToResultListItem(shape);
		this.resultsList.append(listItem);
		
		//EditableShape
		const editableShape = this.shapeToEditableShape(shape);
		listItem.append(editableShape);
	}
	
	shapeToEditableShape(shape) {
		return new EditableShape({
			shape: shape,
			saveButton: {
				callback: () => this.save(shape.id)
			},
			deleteButton: {
				callback:() => this.delete(shape.id)
			}
		});
	}
	
	shapeToResultListItem(shape) {
		//List item
		const listItem = document.createElement("li");
		listItem.className = "shapeChartListItem";
		return listItem;
	}
	
	getResultIndex(idShape) {
		const editableShapes = this.editableShapes;
		for(let i = 0; i < editableShapes.length; ++i) {
			if(this.editableShapes[i].shapeChart.shape.id === idShape) {
				return i;
			}
		}
		return null;
	}
	
	reset() {
		this.relativeFretSelects.forEach(fretSelect => fretSelect.fret = ANY_FRET);
		this.clearResults();
		this.resultsContainer.dataset.isEmpty = true;
	}
	
	clearResults() {
		this.resultsList.innerHTML = "";
	}
	
	save(idShape) {
		const editableShapeViews = this.editableShapeViews;
		const resultIndex = this.getResultIndex(idShape);
		shapeService.editShape(
			idShape,
			editableShapeViews[resultIndex].shapeChartView.shape
		);
		editableShapeViews[resultIndex].initialShape =
			editableShapeViews[resultIndex].shapeChartView.shape;
	}
	
	delete(idShape) {
		if(window.confirm("Do you really want to delete?")) {
			shapeService.deleteShape(idShape);
			this.search();
		}
	}
}

customElements.define(
	"shapes-editor",
	ShapesEditor,
	{extends: "div"}
);