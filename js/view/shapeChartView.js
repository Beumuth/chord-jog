class ShapeChartView {
	constructor(shape=new Shape(), fixedMin=null) {
		this.shape = shape;
		this.fixedMin = fixedMin;
		this.initializeConstants();
		this.initializeHtml();
		this.render();
	}
	
	initializeConstants() {
		this.canvasWidth = 130;
		this.canvasHeight = 125;
		this.fretboardWidth = 90;
		this.fretboardHeight = 110;
		
		this.horizontalFretboardPadding = 5+(this.canvasWidth - this.fretboardWidth) / 2;
		this.verticalFretboardPadding = 12;
		this.horizontalStringSpacing = this.fretboardWidth / 5;
		this.verticalFretSpacing = this.fretboardHeight / 5;
		this.fretLabelPadding = 15;
		
		this.openStringCircleRadius=4.5;
		this.deadStringCircleRadius=4.5;
		this.fingerOnStringCircleRadius=8;
		
		this.textHeight=10;
	}
	
	initializeHtml() {
		//Container
		this.container = document.createElement("div");
		this.container.className = "shapeChartView";
		this.container.dataset.idShape = this.shape.id;
		this.container.dataset.fixedMin = this.fixedMin == null;
		
		//Canvas
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.canvasWidth;
		this.canvas.height = this.canvasHeight;
		this.container.append(this.canvas);
		
		this.context = this.canvas.getContext("2d");
	}
	
	render() {
		this.context.clearRect(
			0,
			0,
			this.canvasWidth,
			this.canvasHeight
		);
		this.context.moveTo(0, 0);
		this.drawGrid();
		this.drawFretLabels();
		this.drawFingerIndicators();
	}
	
	drawGrid() {
		this.context.beginPath();		
		//Vertical lines (strings)
		for(let i = 0; i < 6; ++i) {
			this.context.moveTo(this.horizontalFretboardPadding+i*this.horizontalStringSpacing, this.verticalFretboardPadding);
			this.context.lineTo(this.horizontalFretboardPadding+i*this.horizontalStringSpacing, this.verticalFretboardPadding+this.fretboardHeight);
		}		
		//Horizontal lines (frets)
		for(let i = 0; i <= 5; ++i) {				
			this.context.moveTo(this.horizontalFretboardPadding, this.verticalFretboardPadding+i*this.verticalFretSpacing);
			this.context.lineTo(this.horizontalFretboardPadding+this.fretboardWidth, this.verticalFretboardPadding+i*this.verticalFretSpacing);
		}		
		this.context.stroke();
	}
	
	drawFretLabels() {
		this.context.font = "bold 12px Arial";
		this.context.fillStyle = "black";
		this.context.textAlign = "right";
		let fretLabelProcess;
		if(this.fixedMin == null) {
			fretLabelProcess = i => i == 0 ? "r" : "+" + i;
		} else {
			let minFret = this.getMinLabelledFret();
			fretLabelProcess = i => (minFret + i);
		}
		for(let i = 0; i < 5; ++i) {
			this.context.fillText(
				fretLabelProcess(i),
				this.fretLabelPadding,
				this.verticalFretboardPadding +
					.5 * (this.verticalFretSpacing + this.textHeight) + 
					i * this.verticalFretSpacing
			);
		}
	}
	
	getMinLabelledFret() {
		if(this.fixedMin != null) {
			return Math.max(this.fixedMin, 1);
		}
		let min = Infinity;
		for(let i = 0; i < this.shape.strings.length; ++i) {
			let fret = this.shape.strings[i].fret;
			min = fret < min ? fret : min;
		}
		return min;
	}
	
	drawFingerIndicators() {
		//Digest the shape into greater digestibility
		let model = this.getFingerIndicatorModel();
		
		//Draw dead strings
		model.deadStrings.forEach(this.drawDeadString.bind(this));
		//Draw open strings
		model.openStrings.forEach(this.drawOpenString.bind(this));
		//Draw single-fret fingers
		for(let finger in model.singles) {
			for(let fret in model.singles[finger]) {
				this.drawFingerOnString(
					finger,
					model.singles[finger][fret],
					fret
				);
			}
		}
		//Draw barred fingers
		for(let finger in model.bars) {
			for(let fret in model.bars[finger]) {
				this.drawFingerBar(
					finger,
					model.bars[finger][fret][0],
					model.bars[finger][fret][1],
					fret
				);
			}
		}
	}
	
	getFingerIndicatorModel() {
		//Map<String, Object> of finger-fret types and their values
		let model = {
			deadStrings: [],	//List<Int> of guitar string indices
			openStrings: [],	//List<Int> of guitar string indices
			singles: [],		//Map<Int, Map<Int, Int>> finger => fret => string
			bars: []			//Map<Int, Map<Int, Pair<Int, Int>>> finger => fret => (minString, maxString)
		};
		
		//Iterate through the shape's strings
		for(let string = 0; string < this.shape.strings.length; ++string) {
			let stringAction = this.shape.strings[string];
			let finger = stringAction.finger;
			let fret = stringAction.fret;
			
			if(fret === null) {
				//relative fret == null ==> dead string
				model.deadStrings.push(string);
			} else if(this.fixedMin === OPEN_FRET && fret === ROOT_FRET) {
				//(is root fret and is an open shape) ==> open string
				model.openStrings.push(string);
			} else if(finger in model.bars && fret in model.bars[finger]) {
				//Finger already a part of a bar on this fret.
				//Expand the range of the bar to include this string.
				model.bars[finger][fret] = {
					0: Math.min(model.bars[finger][fret][0], string),
					1: Math.max(model.bars[finger][fret][1], string)
				};
			} else if(
				finger in model.singles &&
				fret in model.singles[finger]
			) {
				//Finger is used on this fret with on one other string.
				//Convert the finger-fret from a single to a bar.
				let minMax = {
					0: Math.min(model.singles[finger][fret], string),
					1: Math.max(model.singles[finger][fret], string)
				};
				if(! (finger in model.bars)) {
					model.bars[finger] = {[fret]: minMax};
				} else  {
					model.bars[finger][fret] = minMax;
				}
				delete model.singles[finger][fret];
				
				if(Object.keys(model.singles[finger]).length === 0) {
					//The finger is no longer used on any frets as a single.
					//Remove it as a single.
					delete model.singles[finger];
				}
			} else if(finger in model.singles) {
				//Finger is used as a single, but not on this fret.
				//Add it as a single on this fret.
				model.singles[finger][fret] = string;
			} else {
				//Finger is completely unused.
				//Add it as a single on this fret.
				model.singles[finger] = {[fret]: string};
			}
		}
		
		return model;
	}
	
	fingerToLabel(finger) {
		if(finger === "null") {
			return "?";
		}
		if(finger === "0") {
			return "T";
		}
		return finger + "";
	}
	
	drawOpenString(stringNumber) {
		this.context.beginPath();
		this.context.arc(
			this.horizontalFretboardPadding+stringNumber*this.horizontalStringSpacing,
			1 + this.openStringCircleRadius,
			this.openStringCircleRadius,
			0,
			2*Math.PI
		);
		this.context.stroke();
	}
	
	drawDeadString(stringNumber) {
		let centerX = this.horizontalFretboardPadding+stringNumber*this.horizontalStringSpacing;
		let centerY = this.deadStringCircleRadius;
		
		//Draw x
		this.context.beginPath();
		this.context.moveTo(
			centerX-(this.deadStringCircleRadius*Math.sqrt(2))/2,
			1 + centerY-(this.deadStringCircleRadius*Math.sqrt(2))/2
		);
		this.context.lineTo(
			centerX+(this.deadStringCircleRadius*Math.sqrt(2))/2,
			1 + centerY+(this.deadStringCircleRadius*Math.sqrt(2))/2
		);
		this.context.stroke();
		this.context.moveTo(
			centerX+(this.deadStringCircleRadius*Math.sqrt(2))/2,
			1 + centerY-(this.deadStringCircleRadius*Math.sqrt(2))/2
		);
		this.context.lineTo(
			centerX-(this.deadStringCircleRadius*Math.sqrt(2))/2,
			1 + centerY+(this.deadStringCircleRadius*Math.sqrt(2))/2
		);
		this.context.stroke();
	}
	
	drawFingerOnString(finger, stringNumber, relativeFret) {
		if(typeof relativeFret === "string" || relativeFret instanceof String) {
			relativeFret = parseInt(relativeFret);
		}
		if(relativeFret !== null && this.fixedMin === OPEN_FRET) {
			--relativeFret;
		}
		
		let centerX = this.horizontalFretboardPadding+stringNumber*this.horizontalStringSpacing;
		let centerY = this.verticalFretboardPadding+this.verticalFretSpacing*(relativeFret+.5);
		
		//Draw circle
		this.context.beginPath();
		this.context.fillStyle = "black";
		this.context.arc(
			centerX,
			centerY,
			this.fingerOnStringCircleRadius,
			0,
			2*Math.PI
		);
		this.context.fill();
		
		//Draw text
		this.context.textAlign = "center";
		this.context.fillStyle = "white";
		this.context.font = "12px Arial";
		this.context.fillText(
			this.fingerToLabel(finger),
			centerX,
			centerY+4
		);
	}
	
	drawFingerBar(finger, startString, endString, relativeFret) {
		if(typeof relativeFret === "string" || relativeFret instanceof String) {
			relativeFret = parseInt(relativeFret);
		}
		if(relativeFret !== null && this.fixedMin === OPEN_FRET) {
			--relativeFret;
		}
		
		let centerX = this.horizontalFretboardPadding+(startString+.5*(endString-startString))*this.horizontalStringSpacing;
		let centerY = this.verticalFretboardPadding+this.verticalFretSpacing*(relativeFret+.5);
		
		//Draw rectangle
		this.context.fillStyle = "black";
		this.context.fillRect(
			this.horizontalFretboardPadding+startString*this.horizontalStringSpacing,
			this.verticalFretboardPadding+this.verticalFretSpacing*relativeFret+.5*this.verticalFretSpacing-this.fingerOnStringCircleRadius,
			(endString-startString)*this.horizontalStringSpacing,
			2*this.fingerOnStringCircleRadius
		);
		
		//Draw circles to round the rectangle ends
		this.context.beginPath();
		this.context.arc(
			this.horizontalFretboardPadding+startString*this.horizontalStringSpacing,
			this.verticalFretboardPadding+this.verticalFretSpacing*relativeFret+.5*this.verticalFretSpacing,
			this.fingerOnStringCircleRadius,
			0,
			2*Math.PI
		);
		this.context.fill();
		
		this.context.beginPath();
		this.context.arc(
			this.horizontalFretboardPadding+endString*this.horizontalStringSpacing,
			this.verticalFretboardPadding+this.verticalFretSpacing*relativeFret+.5*this.verticalFretSpacing,
			this.fingerOnStringCircleRadius,
			0,
			2*Math.PI
		);
		this.context.fill();
		
		
		//Draw text
		this.context.textAlign = "center";
		this.context.fillStyle = "white";
		this.context.font = "12px Arial";
		this.context.fillText(
			this.fingerToLabel(finger),
			centerX,
			centerY+4
		);
	}
}