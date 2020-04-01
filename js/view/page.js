class Page extends HTMLDivElement {
	constructor(options) {
		super();
		this.initialOptions = {
			pageTitle: options.pageTitle
		};
	}
	
	connectedCallback() {
		//Container
		this.setAttribute("is", "page");
		
		//	Site header
		//		Container
		const siteHeaderContainer = document.createElement("div");
		this.append(siteHeaderContainer);
		siteHeaderContainer.id = "siteHeaderContainer";
		siteHeaderContainer.className = "sectionContainer";
		siteHeaderContainer.dataset.border = "none";
		//			Header
		const siteHeaderHeader = document.createElement("h1");
		siteHeaderHeader.id = "siteHeader";
		siteHeaderHeader.className = "sectionHeader";
		siteHeaderHeader.textContent = "Chord Jog";
		siteHeaderContainer.append(siteHeaderHeader);
		
		//	Page top container
		const topContainer = document.createElement("div");
		this.append(topContainer);
		topContainer.id = "topContainer";
		topContainer.className = "sectionContainer";
		
		//	Page header
		const pageHeader = document.createElement("h2");
		topContainer.append(pageHeader);
		pageHeader.className = "sectionHeader";
		pageHeader.textContent = this.initialOptions.pageTitle;
		
		//	Navigation bar
		//		Container
		const navigationBar = document.createElement("div");
		topContainer.append(navigationBar);
		navigationBar.id = "navBar";
		
		//		Practice button
		const practiceButton = document.createElement("span");
		navigationBar.append(practiceButton);
		practiceButton.id = "practiceLink";
		practiceButton.className = "buttonInput";
		practiceButton.textContent = "Practice";
		practiceButton.onclick = () => window.location.href = HREF_PRACTICE;
		
		//		Shapes button
		const shapesButton = document.createElement("span");
		navigationBar.append(shapesButton);
		shapesButton.id = "shapesLink";
		shapesButton.className = "buttonInput";
		shapesButton.textContent = "Shapes";
		shapesButton.onclick = () => window.location.href = HREF_SHAPES;
	}
}

customElements.define(
	"custom-page",
	Page,
	{extends: "div"}
);