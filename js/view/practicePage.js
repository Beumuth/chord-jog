class PracticePage extends Page {
	constructor() {
		super("Practice");
		this.initializeConstants();
	}
	
	initializeConstants() {
		this.MIN_NUM_CHORDS = 1;
		this.MAX_NUM_CHORDS = 8;
		this.DEFAULT_NUM_SELECTED = 4;
		this.NUM_OPTIONS_KEY = "chord-jog-num-options";
	}
	
	connectedCallback() {
		super.connectedCallback();
		
		//Container
		this.className = "sectionContainer";
		
		//	Num chords selector
		//		Container
		const numChordsContainer = document.createElement("div");
		this.append(numChordsContainer);
		numChordsContainer.id = "numChordsContainer";
		numChordsContainer.dataset.noSelect = true;
		//		Label
		const numChordsLabel = document.createElement("span");
		numChordsContainer.append(numChordsLabel);
		numChordsLabel.id = "numChordsLabel";
		numChordsLabel.textContent = "# chords";
		//		Options
		//			List
		const numChordsList = document.createElement("ol");
		numChordsContainer.append(numChordsList);
		numChordsList.id = "numChordsList";
		const numChords = this.loadNumChords();
		for(let i = this.MIN_NUM_CHORDS; i <= this.MAX_NUM_CHORDS; ++i) {
			//		List item
			const listItem = document.createElement("li");
			numChordsList.append(listItem);
			listItem.className = "numChordsOption";
			listItem.dataset.selected = i === numChords;
			listItem.dataset.value = i;
			listItem.tabIndex = i;
			listItem.textContent = i;
			listItem.onkeydown = this.numChordsOptionKeyDown.bind(this);
			listItem.onkeyup = this.numChordsOptionOnKeyUp.bind(this);
			listItem.onclick = () => this.selectNumChordsOption(listItem);
		}
		//		Reroll button
		const rerollButton = document.createElement("img");
		numChordsContainer.append(rerollButton);
		rerollButton.id = "rerollButton";
		rerollButton.src = "./images/rollingDice.png";
		rerollButton.width = 35;
		rerollButton.height = 35;
		rerollButton.tabIndex = this.MAX_NUM_CHORDS + 1;
		rerollButton.dataset.active = false;
		rerollButton.onkeydown = this.rerollOnKeyDown.bind(this);
		rerollButton.onkeyup = this.rerollOnKeyUp.bind(this);
		rerollButton.onclick = this.rerollChords.bind(this);
		
		//	Shape chart list
		const shapeChartList = document.createElement("ul");
		this.append(shapeChartList);
		shapeChartList.id = "shapeChartList";
		
		//Roll chords
		this.rerollChords();
	}
	
	get numChordsList() {
		return document.getElementById("numChordsList");
	}
	
	get rerollButton() {
		return document.getElementById("rerollButton");
	}
	
	get shapeChartList() {
		return document.getElementById("shapeChartList");
	}
	
	get numChords() {
		return parseInt(this.getSelectedNumChordsListItem().dataset.value);
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
		this
			.querySelector(".numChordsOption[data-selected='true']")
			.dataset
			.selected = false;
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
		
	rerollChords() {
		this.shapeChartList.innerHTML = "";
		shapeService
			.getNRandomFixedShapes(this.numChords)
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
		const listItem = document.createElement("li");
		listItem.className = "shapechartListItem";
		listItem.append(
			new ShapeChart({
				shape: fixedShape.shape,
				fixedMin: fixedShape.fret
			})
		);
		return listItem;
	}
}
customElements.define(
	"practice-page",
	PracticePage,
	{extends: "div"}
);