class Page extends HTMLElement {
	render(pageTitle) {
		//Container
		this.container = document.createElement("div");
		this.container.id = "container";
		document.body.append(this.container);
		
		//	Site header
		//		Container
		let siteHeaderContainer = document.createElement("div");
		siteHeaderContainer.id = "siteHeaderContainer";
		siteHeaderContainer.className = "sectionContainer";
		siteHeaderContainer.dataset.border = "none";
		this.container.append(siteHeaderContainer);
		//			Header
		let siteHeaderHeader = document.createElement("h1");
		siteHeaderHeader.id = "siteHeader";
		siteHeaderHeader.className = "sectionHeader";
		siteHeaderHeader.textContent = "Chord Jog";
		siteHeaderContainer.append(siteHeaderHeader);
		
		//	Page top container
		let topContainer = document.createElement("div");
		topContainer.id = "topContainer";
		topContainer.className = "sectionContainer";
		this.container.append(topContainer);
		
		//	Page header
		const pageHeader = document.createElement("h2");
		pageHeader.className = "sectionHeader";
		pageHeader.textContent = pageTitle;
		topContainer.append(pageHeader);
		
		//	Navigation bar
		//		Container
		let navigationBar = document.createElement("div");
		navigationBar.id = "navBar";
		topContainer.append(navigationBar);
		
		//		Practice button
		let practiceButton = document.createElement("span");
		practiceButton.id = "practiceLink";
		practiceButton.className = "buttonInput";
		practiceButton.textContent = "Practice";
		practiceButton.onclick = () => window.location.href = HREF_PRACTICE;
		navigationBar.append(practiceButton);
		
		//		Shapes button
		let shapesButton = document.createElement("span");
		shapesButton.id = "shapesLink";
		shapesButton.className = "buttonInput";
		shapesButton.textContent = "Shapes";
		shapesButton.onclick = () => window.location.href = HREF_SHAPES;
		navigationBar.append(shapesButton);
	}
}