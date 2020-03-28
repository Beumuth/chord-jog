class PracticeView {
	constructor() {
		this.MIN_NUM_CHORDS = 1;
		this.MAX_NUM_CHORDS = 8;
		this.DEFAULT_NUM_SELECTED = 4;
		this.NUM_OPTIONS_KEY = "chord-jog-num-options";
	}
	
	onPageLoad() {
		pageView.render("Practice");
		
		//Container
		const container = document.createElement("div");
		container.id = "practiceView";
		container.className = "sectionContainer";
		pageView.container.append(container);
		
		//	Num chords selector
		//		Container
		const numChordsContainer = document.createElement("div");
		numChordsContainer.id = "numChordsContainer";
		numChordsContainer.dataset.noSelect = true;
		container.append(numChordsContainer);
		//		Label
		const numChordsLabel = document.createElement("span");
		numChordsLabel.id = "numChordsLabel";
		numChordsLabel.textContent = "# chords";
		numChordsContainer.append(numChordsLabel);
		//		Options
		//			List
		this.numChordsList = document.createElement("ol");
		this.numChordsList.id = "numChordsList";
		numChordsContainer.append(this.numChordsList);
		const numChords = this.loadNumChords();
		for(let i = this.MIN_NUM_CHORDS; i <= this.MAX_NUM_CHORDS; ++i) {
			//		List item
			let listItem = document.createElement("li");
			listItem.className = "numChordsOption";
			listItem.dataset.selected = i === numChords;
			listItem.dataset.value = i;
			listItem.tabIndex = i;
			listItem.textContent = i;
			listItem.onkeydown = this.numChordsOptionKeyDown.bind(this);
			listItem.onkeyup = this.numChordsOptionOnKeyUp.bind(this);
			listItem.onclick = () => this.selectNumChordsOption(listItem);
			this.numChordsList.append(listItem);
		}
		//		Reroll button
		this.rerollButton = document.createElement("img");
		this.rerollButton.id = "rerollButton";
		this.rerollButton.src = "./images/rollingDice.png";
		this.rerollButton.width = 35;
		this.rerollButton.height = 35;
		this.rerollButton.tabIndex = this.MAX_NUM_CHORDS + 1;
		this.rerollButton.dataset.active = false;
		this.rerollButton.onkeydown = this.rerollOnKeyDown.bind(this);
		this.rerollButton.onkeyup = this.rerollOnKeyUp.bind(this);
		this.rerollButton.onclick = this.rerollChords.bind(this);
		numChordsContainer.append(this.rerollButton);
		
		//	Shape chart list
		this.shapeChartList = document.createElement("ul");
		this.shapeChartList.id = "shapeChartList";
		container.append(this.shapeChartList);
		
		//Roll chords
		this.rerollChords();
	}
	
	numChordsOptionKeyDown(e) {
		if(e.keyCode == KEY_CODE_SPACE) {
			event.preventDefault();
		}
	}
	
	numChordsOptionOnKeyUp(e) {
		if(e.keyCode == KEY_CODE_SPACE) {
			this.selectNumChordsOption(e.target);
		}
	}
	
	rerollOnKeyDown(e) {
		if(e.keyCode == KEY_CODE_SPACE) {
			event.preventDefault();
			this.rerollButton.dataset.active = true;
		}
	}
	
	rerollOnKeyUp(e) {
		this.rerollButton.dataset.active = false;
		if(e.keyCode == KEY_CODE_SPACE) {
			this.rerollChords();
		}
	}
	
	selectNumChordsOption(numChordsListItem) {
		$(".numChordsOption[data-selected='true']").attr("data-selected", "false");
		numChordsListItem.dataset.selected = true;
		this.rerollChords();
		this.saveNumChords(numChordsListItem.dataset.value);
	}
	
	getSelectedNumChordsListItem() {
		const listItems = this.numChordsList.getElementsByTagName("li");
		for(let listItem of listItems) {
			if(listItem.dataset.selected === 'true') {
				return listItem;
			}
		}
		return null;
	}
	
	getNumChords() {
		return parseInt(this.getSelectedNumChordsListItem().dataset.value);
	}
		
	rerollChords() {
		this.shapeChartList.innerHTML = "";
		shapeService
			.getNRandomFixedShapes(this.getNumChords())
			.map(this.fixedShapeToListItem.bind(this))
			.forEach(listItem => this.shapeChartList.append(listItem));
	}
	
	loadNumChords() {
		const numSelected = localStorage.getItem(this.NUM_OPTIONS_KEY);
		return numSelected === null || numSelected.length === 0 ?
			this.DEFAULT_NUM_SELECTED :
			parseInt(numSelected);
	}
	
	saveNumChords(numChords) {
		localStorage.setItem(this.NUM_OPTIONS_KEY, numChords);
	}
	
	fixedShapeToListItem(fixedShape) {
		let listItem = document.createElement("li");
		listItem.className = "shapechartListItem";
		listItem.append(
			new ShapeChartView(fixedShape.shape, fixedShape.fret).container
		);
		return listItem;
	}
}

const practiceView = new PracticeView();