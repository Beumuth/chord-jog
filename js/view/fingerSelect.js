class FingerSelect extends HTMLElement {
	static TAG_NAME = "finger-select";
	
	static T_RANGES = [
		
	];
	
	constructor(options={}) {
		super();
		this.initialOptions = {
			finger: options.finger !== undefined ?
				options.finger :
				Finger.UNKNOWN
		};
	}
	
	connectedCallback() {
		const createSVGElement = (tagName) =>
			document.createElementNS(
				"http://www.w3.org/2000/svg",
				tagName
			);
			
		//Create SVG
		const svg = createSVGElement("svg");
		svg.setAttribute("viewBox", "0 0 233 291");
		svg.setAttribute("width", "233");
		svg.setAttribute("height", "291");
		svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		svg.setAttribute("fill", "#B56031");
		svg.setAttribute("stroke", "#000");
		svg.setAttribute("stroke-width", "1.85815561px");
		svg.setAttribute("stroke-linecap", "butt");
		svg.setAttribute("stroke-linejoin", "miter");
		svg.setAttribute("font-family", "Helvetica");
		svg.setAttribute("font-size", 37.16311264);
		this.append(svg);
		
		//Create group
		const group = createSVGElement("g");
		svg.append(group);
		
		//Create outline
		const outline = createSVGElement("path");
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
			z`
		);
		this.outlineLength = outline.getTotalLength();
		group.append(outline);
		
		//Create sample points around the outline, used to calculate
		//which finger the mouse cursor is in.
		const numSamplePoints = 1000;
		this.samplePoints = _.times(numSamplePoints, i => _.assign(
			outline.getPointAtLength(i * this.outlineLength / numSamplePoints),
			{length: i * this.outlineLength / numSamplePoints}
		));
			
		let closestPointIndicator = createSVGElement("circle");
		closestPointIndicator.setAttribute("r", 3);
		group.append(closestPointIndicator);
		const sensitivity = 5;
		group.addEventListener("mousemove", (e) => {
			const startTime = new Date().getTime();
			const distance2ToMouse = (x, y) =>
				Math.pow(e.offsetX - x, 2) +
				Math.pow(e.offsetY - y, 2);
			const samplesDistances2 = this.samplePoints.map(samplePoint =>
				distance2ToMouse(samplePoint.x, samplePoint.y)
			);
			const estimate =  this.samplePoints[
				_.range(0, numSamplePoints)
				.reduce((a, b) =>
					samplesDistances2[a] <= samplesDistances2[b] ? a : b
				)
			];
			closestPointIndicator.setAttribute("cx", estimate.x);
			closestPointIndicator.setAttribute("cy", estimate.y);
			console.log(new Date().getTime() - startTime + "ms");
		});
		
		//Create finger labels
		const createAndAddLabel = (finger, x, y) => {
			const label = createSVGElement("text");
			label.textContent = finger;
			label.setAttribute("x", x);
			label.setAttribute("y", y);
			label.setAttribute("pointer-events", "none");
			label.dataset.finger = finger;
			group.append(label);
		};
		createAndAddLabel(Finger.ANY, 142, 262);
		createAndAddLabel(Finger.THUMB, 21, 200);
		createAndAddLabel(Finger.INDEX, 78, 110);
		createAndAddLabel(Finger.MIDDLE, 123, 94);
		createAndAddLabel(Finger.RING, 167, 100);
		createAndAddLabel(Finger.PINKY, 208, 128);
	}
	
	get finger() {
		return Finger.fromString(
			this.options[this.selectedIndex].value
		);
	}
	
	set finger(finger) {
		const fingerAsString = Finger.toString(finger);
		this.selectedIndex = Integer
			.range(0, this.options.length)
			.find(i => this.options[i].value === fingerAsString);
	}
	
	/**
	 * Gets the closest finger to the given x,y coordinate.
	 *
	 * This is calculated by iteratively estimating the closest point on the
	 * hand's outline using ternary search. With each round, the possible
	 * range (which initializes as the whole hand) is trisected with three
	 * evenly-spaced points; the two closest points to (x,y) are chosen,
	 * becoming the bounds for the new possible range. This is repeated
	 * until the possible range is completely within one of the fingers'
	 * ranges, or the length of the possible range is <= the
	 * CLOSEST_FINGER_SENSITIVITY.
	 *
	 * More precisely, 
	 */
	static CLOSEST_FINGER_SENSITIVITY = .1;
	getClosestFinger(x, y) {
		// const doRound = (denominator, numeratorA, distance2A, distance2B) => {
			// return (numeratorA / denominator) * this.outline.
		// }
		let closestPoint;
		
		return closestPoint;
	}
}

customElements.define(
	FingerSelect.TAG_NAME,
	FingerSelect
);