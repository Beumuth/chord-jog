class FingerSelect {
	static TAG_NAME = "finger-select";static distance2 = (a, b) =>
		Math.pow(a[0] - b[0], 2) +
		Math.pow(a[1] - b[1], 2);
		
	static projectPointOnLineSegment = (segment, p) => {
		const 	px = p[0] - segment[0][0],
				py = p[1] - segment[0][1],
				ux = segment[1][0] - segment[0][0],
				uy = segment[1][1] - segment[0][1],
				k = _.clamp((px*ux + py*uy) / (ux*ux + uy*uy), 0, 1)
		//proj(p, u) = k*u
		return [segment[0][0] + k * ux, segment[0][1] + k * uy];
	};
	
	static distance2MapperGenerators = {
		point: (p) => _.partial(FingerSelect.distance2, p),
		lineSegment: (lineSegment) => (p) =>
			FingerSelect.distance2(
				p,
				FingerSelect.projectPointOnLineSegment(lineSegment, p)
			)
	};
	
	static regions =  {
		any: {
			finger: Finger.ANY,
			text: Finger.ANY,
			x: 149,
			y: 250,
			offsetX: -.25,
			offsetY: 3.5,
			distance2Mapper: FingerSelect.distance2MapperGenerators.point([149, 241])
		},
		thumb: {
			finger: Finger.THUMB,
			text: Finger.THUMB,
			x: 37.8,
			y: 188,
			offsetX: -.5,
			offsetY: -.5,
			distance2Mapper: FingerSelect.distance2MapperGenerators.lineSegment([
				[11, 137],
				[47, 211]
			])
		},
		index: {
			finger: Finger.INDEX,
			text: Finger.INDEX,
			x: 91,
			y: 110,
			offsetX: .5,
			offsetY: -.5,
			distance2Mapper: FingerSelect.distance2MapperGenerators.lineSegment([
				[82, 25],
				[94, 141]
			])
		},
		middle: {
			finger: Finger.MIDDLE,
			text: Finger.MIDDLE,
			x: 135.75,
			y: 94,
			offsetX: 0,
			offsetY: -.5,
			distance2Mapper: FingerSelect.distance2MapperGenerators.lineSegment([
				[131, 7],
				[139, 133]
			])
		},
		ring: {
			finger: Finger.RING,
			attribute: "middle",
			text: Finger.RING,
			x: 177.5,
			y: 104,
			offsetX: -1,
			offsetY: 0,
			distance2Mapper: FingerSelect.distance2MapperGenerators.lineSegment([
				[179, 29],
				[175, 141]
			])
		},
		pinky: {
			finger: Finger.PINKY,
			text: Finger.PINKY,
			x: 217.3,
			y: 130,
			offsetX: -1.75,
			offsetY: -1,
			distance2Mapper: FingerSelect.distance2MapperGenerators.lineSegment([
				[219, 61],
				[219, 158]
			])
		}
	}
	
	static states = [
		"unselected",
		"preview",
		"selected",
		"unselectable"
	];
	
	static regionWithFinger(finger) {
		return _.toPairs(FingerSelect.regions) //Convert the region info to pairs.
			.find(region => region[1].finger === finger) //Get one with finger.
			[0];	//Return the region.
	}
	
	static closestFingerToPoint(p) {
		return _.values(FingerSelect.regions).map(region => ({	//Regions --> object
			finger: region.finger,	//with two properties: finger
			distance2: region.distance2Mapper(p)	//and distance^2 to p;
		})).reduce((a, b) => a.distance2 < b.distance2 ? a : b) //reduce by min d^2,
		.finger;	//returning the finger
	}
	
	static createSVGElement = (tagName) =>
		document.createElementNS(
			"http://www.w3.org/2000/svg",
			tagName
		);
	
	static createHandOutline = () => {
		const outline = FingerSelect.createSVGElement("path");
		outline.setAttribute("fill", "none");
		outline.setAttribute("class", "outline");
		outline.setAttribute("stroke", "#000");
		outline.setAttribute(	//Drawn with Inkscape
			"d",
			`M
				90.24086,	287.90208
			C
				65.553543,	278.2203
				58.735661,	267.8963
				44.888627,	249.27999
				
				41.477532,	244.69408
				31.698887,	231.03142
				29.347764,	224.59326
				
				27.055052,	214.83116
				25.07621,	205.17052
				22.760006,	198.50736
				
				20.885747,	193.11564
				14.138771,	180.79899
				12.027004,	174.7266
				
				10.37836,	169.98589
				10.255809,	162.7399
				8.2089209,	155.89701
				
				6.8990141,	151.51793
				5.4228811,	145.45277
				1.4765024,	135.88287
			c
				-2.8811867,	-6.98685
				5.8594728,	-11.25498
				18.1170216,	-5.80672
				
				10.822529,	4.81044
				12.906949,	8.67208
				17.992632,	15.02954
				
				4.381971,	5.47776
				11.338612,	33.54161
				22.276197,	41.0769
				
				1.759648,	1.21229
				3.823847,	-0.1425
				3.823847,	-0.1425
				
				3.403311,	-9.60373
				12.928881,	-18.62113
				12.156321,	-50.01484
			C
				75.591525,		125.82638
				74.091922,		108.61179
				72.695207,		93.170149
				
				72.187304,		87.554666
				71.917408,		76.230509
				71.60716,		70.018286
				
				71.27307,		63.328224
				69.998647,		52.954412
				69.976007,		48.065245
			c
				-0.02475,		-5.335972
				-0.09676,		-15.052854
				1.293281,		-23.298712
				
				1.834863,		-10.884309
				17.963013,		-10.117052
				20.891868,		-2.365259
				
				2.804369,		11.617646
				3.238162,		18.094071
				4.170184,		23.550833
				
				1.18185,		6.919363
				2.16547,		15.427318
				3.194578,		20.506386
				
				1.032022,		5.093395
				3.237512,		14.515669
				5.231872,		24.123065
				
				2.63942,		8.691535
				3.12635,		31.588042
				8.42702,		39.301692
				
				2.45347,		3.57033
				3.94736,		4.93439
				8.42847,		5.23948
				
				-0.0251,		-6.38752
				0.44175,		-11.31791
				0.094,			-15.67938
				
				-0.82734,		-10.37706
				-2.74064,		-21.86338
				-3.65289,		-32.619099
				
				-0.59983,		-7.071971
				0.13363,		-19.033253
				0.0713,			-23.889905
				
				-0.0846,		-6.589073
				0.16482,		-16.634983
				0.0695,			-23.901209
				
				-0.11196,		-8.534288
				-0.15176,		-29.014407
				2.89996,		-33.7023676
				
				3.69537,		-5.67665103
				16.47153,		-6.09493802
				19.61992,		0.1074513
				
				3.77308,		7.4330203
				5.63591,		20.4218263
				6.52689,		33.2823953
				
				0.56858,		8.207304
				0.38486,		16.640813
				1.08551,		22.581808
				
				0.87318,		7.403734
				2.96756,		16.415731
				3.89178,		25.242315
				
				0.85051,		8.122744
				-0.31848,		21.581881
				0.40023,		31.949161
				
				0.46752,		6.74365
				0.33744,		9.3262
				2.05853,		12.70339
				
				1.07532,		2.10998
				5.85605,		4.02267
				5.85605,		4.02267
				
				1.38512,		-5.27093
				1.49689,		-9.3538
				1.69222,		-15.16177
				
				0.17522,		-5.20927
				-0.41491,		-12.58731
				0.0408,			-19.73849
				
				0.43058,		-6.75742
				2.63894,		-16.998145
				2.85092,		-21.671145
				
				0.25085,		-5.530013
				1.21975,		-16.805924
				1.43673,		-19.760198
				
				0.65026,		-8.853276
				2.14273,		-25.591214
				3.09617,		-29.71769
				
				2.25599,		-9.763798
				19.84553,		-7.945837
				21.60994,		0.380646
				
				2.21673,		10.461034
				1.49518,		22.851558
				1.05918,		29.488952
				
				-0.38092,		5.79885
				-0.31173,		15.701981
				-0.39707,		20.738562
				
				-0.11832,		6.982007
				0.78488,		17.232073
				1.09147,		23.202643
				
				0.26513,		5.16193
				-0.21878,		17.33488
				-0.9513,		23.07467
				
				-1.77582,		13.91514
				0.90096,		17.44691
				2.30454,		21.55484
				
				1.29837,		3.80005
				5.90152,		5.48296
				5.90152,		5.48296
				
				0.21924,		-9.03558
				3.21515,		-19.80753
				3.57848,		-23.48812
				
				0.44834,		-4.54146
				2.7986,			-12.15729
				3.5118,			-24.00093
				
				0.24811,		-4.12051
				0.41604,		-13.362853
				1.30283,		-21.530475
				
				0.71803,		-6.613163
				1.2482,			-12.945687
				1.95034,		-17.647274
				
				2.16975,		-14.528799
				16.81753,		-8.521086
				18.04217,		-2.46042
				
				0.88398,		4.374668
				2.01203,		17.711465
				2.18703,		22.654216
				
				0.19566,		5.525447
				0.74185,		21.419513
				0.63958,		23.648943
				
				-0.29334,		6.40311
				-0.59407,		20.81883
				-1.08627,		25.13753
				
				-0.70125,		6.15295
				0.64604,		18.26691
				0.72939,		31.73454
				
				0.0964,			15.58975
				-0.9936,		23.30861
				-2.21163,		33.73706
				
				-8.86788,		75.92491
				-30.6335,		85.50484
				-37.94763,		87.08853
				
				-8.97573,		1.94339
				-94.248694,		2.47411
				-100.724424,	-0.0632
			z`.replace(/\s+/g, " ")	//Multiple whitespaces converted to single
		);
		return outline;
	}
	
	static createFingerLabelText = (
		text,
		x,
		y,
		dxAdjust=0,
		dyAdjust=0
	) => {
		const fingerLabelText = FingerSelect.createSVGElement("text");
		fingerLabelText.textContent = text;
		fingerLabelText.setAttribute("x", x);
		fingerLabelText.setAttribute("y", y);
		fingerLabelText.setAttribute("fill", "black");
		fingerLabelText.setAttribute("font-family", "Courier New");
		fingerLabelText.setAttribute("font-size", 37);
		
		//Adjust the position so that (0,0) is the text's center
		fingerLabelText.setAttribute("dx", -10.5 + dxAdjust);
		fingerLabelText.setAttribute("dy", 11.5 + dyAdjust);
		return fingerLabelText;
	};
	
	//	creating <circle> outline for the finger label
	static createFingerLabelOutline = (x, y) => {
		const outline = FingerSelect.createSVGElement("circle");
		outline.setAttribute("r", 16);
		outline.setAttribute("cx", x);
		outline.setAttribute("cy", y);
		outline.setAttribute("fill", "none");
		outline.setAttribute("stroke", "none");
		return outline;
	};
	
	static createFingerLabelGroup = (
		finger,
		text,
		x,
		y,
		dxAdjust=0,
		dyAdjust=0
	) => {
		const fingerLabelGroup = FingerSelect.createSVGElement("g");
		fingerLabelGroup.classList.add("fingerLabel");
		fingerLabelGroup.dataset.finger = finger;
		fingerLabelGroup.append(
			FingerSelect.createFingerLabelText(text, x, y, dxAdjust, dyAdjust)
		);
		fingerLabelGroup.append(
			FingerSelect.createFingerLabelOutline(x, y)
		);
		return fingerLabelGroup;
	};
	
	static createFingerRegion = (
		finger,
		text,
		x,
		y,
		dxAdjust=0,
		dyAdjust=0,
		distance2Mapper	
	) => ({
		finger: finger,
		label: createFingerLabelGroup(finger, finger, x, y, dxAdjust, dyAdjust),
		distance2Mapper: distance2Mapper
	});
	
	static Standalone = class extends HTMLElement {
		static get observedAttributes() {
			return _.keys(FingerSelect.regions);
		};
		
		constructor(options={}) {
			super();
		}
		
		get thumb() {
			return this.getAttribute("thumb");
		}
		
		set thumb(state) {
			this.setAttribute("thumb", state);
		}
		
		get index() {
			return this.getAttribute("index");
		}
		
		set index(state) {
			this.setAttribute("index", state);
		}
		
		get middle() {
			return this.getAttribute("middle");
		}
		
		set middle(state) {
			this.setAttribute("middle", state);
		}
		
		get ring() {
			return this.getAttribute("ring");
		}
		
		set ring(state) {
			this.setAttribute("ring", state);
		}
		
		get pinky() {
			return this.getAttribute("pinky");
		}
		
		set pinky(state) {
			this.setAttribute("pinky", state);
		}
		
		get any() {
			return this.getAttribute("any");
		}
		
		set any(state) {
			this.setAttribute("any", state);
		}
		
		get all() {
			return _.toPairs(FingerSelect.regions).map(keyedRegions => ({
				finger: keyedRegions[1].finger,
				state: this.getAttribute(keyedRegions[0])
			}));
		}
		
		get selected() {
			return this.getFingerWithExclusiveState("selected");
		}
		
		set selected(finger) {
			//Unselect if null or undefined
			if(_.isNil(finger)) {
				return this.unselect();
			}
			
			//Get the newly selected region state
			const selectedFingerCurState = this.getFingerState(finger);
			//Is it unselectable or already selected?
			if(["unselectable", "selected"].includes(selectedFingerCurState)) {
				//Yes. Do nothing.
				return;
			}
			
			//Get the previously selected region
			const previouslySelectedFinger = this.selected;
			//Does one exist?
			if(previouslySelectedFinger !== null) {
				//Yes. Unselect it.
				this.setFingerState(previouslySelectedFinger, "unselected");
			}
			
			//Select the new finger
			this.setFingerState(finger, "selected")
		}
		
		get preview() {
			return this.getFingerWithExclusiveState("preview");
		}
		
		set preview(finger) {
			//Unpreview if null or undefined
			if(_.isNil(finger)) {
				return this.unpreview();
			}
			
			//Get the current preview region (possibly undefined)
			const existingPreviewFinger = this.preview;
			//Does one exist, and if so does it differ from the current preview finger?
			if(! [null, finger].includes(existingPreviewFinger)){
				//Yes. Unselect it.
				this.setFingerState(existingPreviewFinger, "unselected");
			}
			//Is the new region unselected?
			if(this.getFingerState(finger) === "unselected") {
				//Yes. Preview it (only unselected regions can be previewed)
				this.setFingerState(finger, "preview");
			}
		}
		
		connectedCallback() {
			this.connectStyle();
			this.connectSVG();
			this.connectAttributes();
		}
		
		attributeChangedCallback(name, oldValue, newValue) {
			//Is the finger-selected not yet connected?
			if(! this.isConnected) {
				//No, ignore.
				return;
			}
			
			//Is the attribute a region?
			if(_.keys(FingerSelect.regions).includes(name)) {
				//Yes - is it valid?
				if(! FingerSelect.states.includes(newValue)) {
					//No - reset to the old value and return
					return this.setAttribute(name, oldValue);
				}
				
				//Valid. Is this an exclusive state?
				if(["preview", "selected"].includes(newValue)) {
					//Yes. If there's another region with the exclusive state,
					//switch it to 'unselected'.
					_.keys(FingerSelect.regions)
						.map(region => ({
							region: region,
							state: this.getAttribute(region)}))
						.filter(regionState =>
							name !== regionState.region &&
							regionState.state === newValue)
						.forEach(regionState =>
							this.setAttribute(regionState.region, "unselected"));
				}
				
				//Style the region according to the new state.
				const fingerLabel = this.getRegionFingerLabel(name);
				const fingerLabelOutline = fingerLabel.querySelector("circle");
				//Hide the label if 'unselectable'
				fingerLabel.setAttribute("display",
					"unselectable" === newValue ?
						"none" : "inline");	
				//Show the stroke if 'preview' or 'selected'
				fingerLabelOutline.setAttribute("stroke",
					["preview", "selected"].includes(newValue) ?
						"black" : "none");
				//Dash the stroke if 'preview'
				fingerLabelOutline.setAttribute("stroke-dasharray",
					"preview" === newValue ?
						"4 5" : null);
			}
		}
		
		connectAttributes() {
			_.keys(FingerSelect.regions).forEach(region => {
				let initialAttribute = this.getAttribute(region);
				this.setAttribute(region, 
					FingerSelect.states.includes(initialAttribute) ?
						initialAttribute :
						"unselected");
			});
		}
		
		connectStyle() {
			const style = document.createElement("style");
			style.textContent = `
				text {
					-webkit-user-select: none;
					-moz-user-select: none;
					-ms-user-select: none;
					user-select: none;
				}`;
			this.append(style);
		}
		
		connectSVG() {
			const svg = FingerSelect.createSVGElement("svg");
			svg.setAttribute("viewBox", "0 0 235 291");
			svg.setAttribute("width", "235");
			svg.setAttribute("height", "291");
			svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
			svg.append(this.createHandGroup());
			this.append(svg);
		}
		
		createHandGroup() {
			const group = FingerSelect.createSVGElement("g");
			group.setAttribute("cursor", "pointer");
			group.setAttribute("pointer-events", "fill");
			group.setAttribute("class", "hand");
			group.append(FingerSelect.createHandOutline());
			
			//Create finger labels for each region
			_.values(FingerSelect.regions).map(region =>
				FingerSelect.createFingerLabelGroup(
					region.finger,
					region.text,
					region.x,
					region.y,
					region.offsetX,
					region.offsetY
				)
			).forEach(fingerLabelGroup => group.append(fingerLabelGroup));
			
			//Mouse move handler
			group.addEventListener("mousemove", (e) => {
				//Get the preview region based on closest point to mouse
				const previewFinger = FingerSelect.closestFingerToPoint(
					[e.offsetX, e.offsetY]);
					
				//Set the cursor to 'auto' if the preview region is 'unselectable',
				//otherwise 'pointer'.
				this.querySelector(".hand").setAttribute("cursor",
					"unselectable" === this.getFingerState(previewFinger) ?
						"auto" : "pointer");
				//Set the preview
				
				this.preview = previewFinger;
			});
			
			//Mouse down handler
			group.addEventListener("mousedown", (e) =>{
				if(e.button === 0)	//If left click,
					this.selected =	//then select
						FingerSelect.closestFingerToPoint(	//the closest point
							[e.offsetX, e.offsetY])	//to the cursor
			});
			
			//Mouse leave handler - unselect the preview region if one exists
			group.addEventListener("mouseleave", this.unpreview.bind(this));
			return group;
		}
		
		unpreview() {
			const previewFinger = this.preview;
			if(! _.isNil(previewFinger)) {
				this.setFingerState(previewFinger, "unselected");
			}	
		}
		
		unselect() {
			const selectedFinger = this.selected;
			if(! _.isNil(selectedFinger)) {
				this.setFingerState(selectedFinger, "unselected");
			}
		}
		
		getFingerState(finger) {
			return this.getAttribute(FingerSelect.regionWithFinger(finger));
		}
		
		setFingerState(finger, state) {
			this.setAttribute(FingerSelect.regionWithFinger(finger), state);
		}
		
		getFingerWithExclusiveState(state) {
			return _.defaultTo(
				this.all.find(regionState => regionState.state === state),
				{finger: null}
			).finger;
		}
		
		getRegionFingerLabel(region) {
			return this.querySelector(
				`.fingerLabel[data-finger='${FingerSelect.regions[region].finger}']`
			);
		}
	}
	
	static newStandalone(options={}) {
		return new FingerSelect.Standalone(options);
	}
	
	static newSVGGroup(options={}) {
		//TODO
		return FingerSelect.createHandOutline();
	}
}
customElements.define(
	FingerSelect.TAG_NAME,
	FingerSelect.Standalone
);