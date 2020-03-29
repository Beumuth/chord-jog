class ShapesEditorView {
	constructor() {
		this.initializeHtml();
	}
	
	initializeHtml() {
		//Container
		this.container = document.createElement("div");
		this.container.className = "shapesEditor";
		this.container.classList.add("sectionContainer");
		
		this.createSearchContainer();
		this.createResultsContainer();
	}
	
	createSearchContainer() {
		//Search container
		let searchContainer = document.createElement("div");
		searchContainer.className = "editShapesSearchContainer";
		searchContainer.classList.add("sectionContainer");
		this.container.append(searchContainer);
		
		//	Search header
		let header = document.createElement("h3");
		header.className = "sectionHeader";
		header.textContent = "Search";
		searchContainer.append(header);
		
		//	Search table
		let searchTable = document.createElement("table");
		searchTable.className = "searchTable";
		searchContainer.append(searchTable);
		
		//		Header row
		let headerRow = document.createElement("tr");
		searchTable.append(headerRow);
		
		//		Fret inputs row
		this.relativeFretSelectViews = new Array();
		let searchFretInputsRow = document.createElement("tr");
		searchTable.append(searchFretInputsRow);
		for(let i = 0; i < NUM_STRINGS; ++i) {
			//		Header cell
			let headerCell = document.createElement("th");
			headerCell.textContent = STRING_NAMES[i];
			headerRow.append(headerCell);
			
			//		Input cell and input
			let inputCell = document.createElement("td");
			let relativeFretSelectView = new RelativeFretSelectView({
				string: i,
				nullable: true
			});
			relativeFretSelectView.fretSelect.addEventListener(
				"change",
				this.search.bind(this)
			);
			this.relativeFretSelectViews.push(relativeFretSelectView);
			inputCell.append(relativeFretSelectView.fretSelect);
			searchFretInputsRow.append(inputCell);
		}
		
		//	Button container
		let searchButtonContainer = document.createElement("div");
		searchButtonContainer.className = "searchButtonContainer";
		searchContainer.append(searchButtonContainer);
		
		//		Reset button
		let resetButton = document.createElement("button");
		resetButton.type = "button";
		resetButton.className = "searchResetButton";
		resetButton.textContent = "Reset";
		resetButton.onclick = this.reset.bind(this);
		searchButtonContainer.append(resetButton);
	}
	
	createResultsContainer() {
		//Results container
		this.resultsContainer = document.createElement("div");
		this.resultsContainer.className = "editShapesResultsContainer";
		this.resultsContainer.classList.add("sectionContainer");
		this.resultsContainer.dataset.isEmpty = "true";
		this.container.append(this.resultsContainer);
		
		//	Results header
		let resultsHeader = document.createElement("h3");
		resultsHeader.className = "sectionHeader";
		resultsHeader.textContent = "Editor";
		this.resultsContainer.append(resultsHeader);
		
		//	'Search for a shape' message
		let searchForShape = document.createElement("span");
		searchForShape.className = "editShapesSearchForShapeMessage";
		searchForShape.textContent = "Search for a shape to edit";
		this.resultsContainer.append(searchForShape);
		
		//	Results list
		this.resultsList = document.createElement("ul");
		this.resultsList.className = "shapeChartList";
		this.resultsContainer.append(this.resultsList);
	}
	
	search() {
		this.clearResults();
		let search = this.relativeFretSelectViews.map(view => view.fret);
		if(
			! search
				.map(string => string === ANY_FRET)
				.reduce((areAllAnyFret, isStringAnyFret) =>
					areAllAnyFret && isStringAnyFret
				)
		) {
			//The search is not all ANY_FRETs
			//Get matches
			let matches = shapeService.searchShapesWithFrets(search);
			
			this.resultsContainer.dataset.isEmpty = matches.length === 0;
			
			//Iterate through matches
			matches.forEach(this.addResult.bind(this));
		}
	}
	
	displaySingleResult(shape) {
		this.clearResults();
		shape.schema.forEach((stringAction, string) =>
			this.relativeFretSelectViews[string].setFret(stringAction[1])
		);
		this.addResult(shape);
		this.resultsContainer.dataset.isEmpty = false;
	}
	
	addResult(shape) {
		//List item
		let listItem = this.shapeToResultListItem(shape);
		this.resultsList.append(listItem);
		
		//EditableShapeView
		let editableShapeView = this.shapeToEditableShapeView(shape);
		listItem.append(editableShapeView.container);
		this.editableShapeViews.push(editableShapeView);
	}
	
	shapeToEditableShapeView(shape) {
		return new EditableShapeView({
			shape: shape,
			saveButtonHandler: () => this.save(shape.id),
			includesDeleteButton: true,
			deleteButtonHandler: () => this.delete(shape.id)
		});
	}
	
	shapeToResultListItem(shape) {
		//List item
		let listItem = document.createElement("li");
		listItem.className = "shapeChartListItem";
		return listItem;
	}
	
	getResultIndex(idShape) {
		for(let i = 0; i < this.editableShapeViews.length; ++i) {
			if(this.editableShapeViews[i].shapeChartView.shape.id === idShape) {
				return i;
			}
		}
		return null;
	}
	
	getEditableShapeView(idShape) {
		return this.editableShapeViews[this.getResultIndex(idShape)];
	}
	
	reset() {
		this.relativeFretSelectViews.forEach(view => view.setFret(ANY_FRET));
		this.clearResults();
		this.resultsContainer.dataset.isEmpty = true;
	}
	
	clearResults() {
		this.resultsList.innerHTML = "";
		this.editableShapeViews = [];
	}
	
	save(idShape) {
		let resultIndex = this.getResultIndex(idShape);
		shapeService.editShape(
			idShape,
			this.editableShapeViews[resultIndex].shapeChartView.shape
		);
		this.editableShapeViews[resultIndex].initialShape =
			this.editableShapeViews[resultIndex].shapeChartView.shape;
	}
	
	delete(idShape) {
		if(window.confirm("Do you really want to delete?")) {
			shapeService.deleteShape(idShape);
			this.search();
		}
	}
}