class ShapeFileLoader {
	constructor(fileList, completeCallback) {
		this.fileList = fileList;
		this.completeCallback = completeCallback;
		this.shapes = [];
		this.numLoaded = 0;
		this.fileReader = new FileReader();
		this.fileReader.addEventListener('loadend', this.fileLoadComplete.bind(this))
		this.readNext();
	}
	
	fileLoadComplete(e) {
		this.shapes = shapeService.mergeShapeLists(
			this.shapes,
			shapeService.shapesFromString(e.target.result)
		);
		
		if(this.numLoaded === this.fileList.length) {
			this.completeCallback(this.shapes);
		} else {
			this.readNext();
		}
	}
	
	readNext() {
		this.fileReader.readAsText(this.fileList[this.numLoaded++]);
	}
}