class PageView {
	constructor() {
	}
	
	onPageLoad() {
		//Container
		this.container = document.createElement("div");
		this.container.id = "container";
		document.body.append(this.container);
		
		//Header
		//	Container
		this.header = document.createElement("div");
		this.header.id = "pageHeaderContainer";
		this.container.append(this.header);
		//	Header
		let headerHeader = document.createElement("h2");
		headerHeader.id = "pageHeader";
		headerHeader.textContent = "Chord Jog";
		this.header.append(headerHeader);
		
		//Navigation bar
		//	Container
		this.navigationBar = document.createElement("div");
		this.navigationBar.id = "navBar";
		this.container.append(this.navigationBar);
		
		//	Practice button
		let practiceButton = document.createElement("span");
		practiceButton.id = "practiceLink";
		practiceButton.className = "buttonInput";
		practiceButton.textContent = "Practice";
		practiceButton.onclick = () => window.location.href = HREF_PRACTICE;
		this.navigationBar.append(practiceButton);
		
		//	Shapes button
		let shapesButton = document.createElement("span");
		shapesButton.id = "shapesLink";
		shapesButton.className = "buttonInput";
		shapesButton.textContent = "Shapes";
		shapesButton.onclick = () => window.location.href = HREF_SHAPES;
		this.navigationBar.append(shapesButton);
	}
}

const pageView = new PageView();