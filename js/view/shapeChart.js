class ShapeChart extends HTMLCanvasElement {
	constructor(options) {
		super();
		this.initialOptions = {
			shape: options.shape ? options.shape : new Shape(),
			fixedMin: options.fixedMin ? options.fixedMin : null
		};
		this.initializeConstants();
	}
	
	connectedCallback() {
		this.setAttribute("is", "shape-chart");
		this.shape = this.initialOptions.shape;
		this.dataset.fixedMin = this.initialOptions.fixedMin;
		
		this.width = this.canvasWidth;
		this.height = this.canvasHeight;
		this.context = this.getContext("2d");
		this.render();
	}
	
	get fixedMin() {
		const fixedMin = this.dataset.fixedMin;
		return fixedMin === "null" ? null : parseInt(fixedMin);
	}
	
	set fixedMin(fixedMin) {
		this.dataset.fixedMin = fixedMin;
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
	
	reset() {
		this.shape = this.initialOptions.shape.copy();;
		this.render();
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
			const minFret = this.getMinLabelledFret();
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
		const min = Infinity;
		for(let i = 0; i < this.shape.strings.length; ++i) {
			const fret = this.shape.strings[i].fret;
			min = fret < min ? fret : min;
		}
		return min;
	}
	
	drawFingerIndicators() {
		//Draw dead strings
		Shape
			.STRINGS
			.filter(string =>
				this.shape.strings[string] === StringAction.DEAD_STRING
			).forEach(this.drawDeadString.bind(this));
		//Draw open strings
		Shape
			.STRINGS
			.filter(string =>
				this.shape.strings[string] === StringAction.OPEN_STRING
			).forEach(this.drawOpenString.bind(this));
		//Draw fingers on frets
		this.shape.fingerActions().forEach(fingerAction => {
			switch(FingerAction.type(fingerAction)) {
				case FingerAction.TYPE_SINGE:
					//A finger on a single string
					this.drawFingerOnString(
						fingerAction.finger,
						fingerAction.string,
						fingerAction.fret
					);
					break;
				case FingerAction.TYPE_BAR:
					//A finger bar
					this.drawFingerBar(
						fingerAction.finger,
						fingerAction.bar.min,
						fingerAction.bar.max,
						fingerAction.fret
					);
			}
		});
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
		const centerX = this.horizontalFretboardPadding+stringNumber*this.horizontalStringSpacing;
		const centerY = this.deadStringCircleRadius;
		
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
		
		const centerX = this.horizontalFretboardPadding+stringNumber*this.horizontalStringSpacing;
		const centerY = this.verticalFretboardPadding+this.verticalFretSpacing*(relativeFret+.5);
		
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
			finger,
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
		
		const centerX = this.horizontalFretboardPadding+(startString+.5*(endString-startString))*this.horizontalStringSpacing;
		const centerY = this.verticalFretboardPadding+this.verticalFretSpacing*(relativeFret+.5);
		
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
			finger,
			centerX,
			centerY+4
		);
	}
}

customElements.define(
	"shape-chart",
	ShapeChart,
	{extends: "canvas"}
);