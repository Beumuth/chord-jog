class ShapeService {
	constructor() {
		this.LOCAL_STORAGE_KEY = "chord-jog-shapes";
		this.loadFromLocalStorage();
		this.fileReader = new FileReader();
	}
	
	/**
	 * Determine if Shape a equals Shape b.
	 */
	equals(a, b) {
		//Are the strings the same?
		for(let i = 0; i < NUM_STRINGS; ++i) {
			if(! a.strings[i].equals(b.strings[i])) {
				//Different string action value
				return false;
			}
		}
		
		//Equal
		return true;
	}
	
	isOpenShape(shape) {
		return OPEN_FRET === shape.range.min && OPEN_FRET === shape.range.max;
	}
	
	doesShapeExist(shape) {
		for(let i = 0; i < this.shapes.length; ++i) {
			if(equals(shape, this.shapes[i])) {
				return true;
			}
		}
		return false;
	}
	
	getIdOfShape(shape) {
		for(let i = 0; i < this.shapes.length; ++i) {
			if(this.equals(shape, this.shapes[i])) {
				return i;
			}
		}
		
		return null;
	}
	
	getShape(id) {
		return this.shapes[id];
	}
	
	getShapes(ids) {
		return ids.map(id => this.shapes[id]);
	}
	
	getNRandomFixedShapes(n) {
		let fixedShapes = new Array();
		let candidate = null;
		for(let i = 0; i < n; ++i) {
			//If the candidate is either null or
			//equals another chosen shape with the same fret
			while(
				candidate == null || (
					fixedShapes.filter(chosen =>
						this.equals(
							chosen.shape,
							candidate.shape
						) &&
						chosen.fret === candidate.fret
					).length > 0
				)
			){
				//Pick another candidate
				const shape = this.getShape(
					Math.floor(
						Math.random() * this.shapes.length
					)
				);
				candidate = {
					shape: shape,
					fret: Math.floor(
						Math.random() * 
						(shape.range.max - shape.range.min) +
						shape.range.min
					)
				};
			}
			fixedShapes.push(candidate);
		}
		return fixedShapes;
	}
	
	createShape(shape) {
		shape.id = this.shapes.length;
		this.shapes.push(shape);
		this.saveToLocalStorage();
	}
	
	editShape(id, shape) {
		this.shapes[id] = shape;
		this.saveToLocalStorage();
	}
	
	deleteShape(id) {
		this.shapes.splice(id, 1);
		this.saveToLocalStorage();
	}
	
	/**
	 * @param frets An array of 9 fret values. Can contain ANY_FRET on any string.
	 * @return An array with a maximum of 9 results.
	 */
	searchShapesWithFrets(frets) {
		let matches = [];
		
		//For each shape
		for(let i = 0; i < this.shapes.length && matches.length < 9; ++i) {
			let isAMatch = true;
			//For each string
			for(let string = 0; string < NUM_STRINGS; ++string) {
				//Does search match the fret for this shape's string?
				if(
					frets[string] !== ANY_FRET &&
					this.shapes[i].strings[string].fret !== frets[string]
				) {
					//No. This shape is not a match.
					isAMatch = false;
					break;
				}
				//This string matches. Check the next one.
			}
			
			if(isAMatch) {
				matches.push(this.shapes[i]);
			}
		}
		
		return matches;
	}
	
	validate(shape, id=null) {
		//An equivalent shape with a different id must not exist.
		let idOfShape = this.getIdOfShape(shape);
		if(idOfShape !== null && idOfShape !== id) {
			return "Already exists";
		}
		
		let containsRootFret = false;
		let isOpenShape = this.isOpenShape(shape);
		let fingerFrets = [{},{},{},{},{}];
		for(let string = 0; string < shape.strings.length; ++string) {
			let stringAction = shape.strings[string];
			
			//Every dead string must have no finger
			if(
				stringAction.fret === DEAD_STRING &&
				stringAction.finger !== NO_FINGER
			) {
				return "Dead string has finger";
			}
			
			//If this is a non-dead string with no fingers, then
			//	a) Must be an open shape, and
			//	b) Must be the root fret.
			if(
				stringAction.fret !== DEAD_STRING &&
				stringAction.finger === NO_FINGER && ! (
					isOpenShape &&
					stringAction.fret === ROOT_FRET
				)
			) {
				return "Finger missing";
			}
			
			//A finger can be placed on at most one fret
			if(stringAction.finger !== null && stringAction.fret !== null) {
				fingerFrets[stringAction.finger][stringAction.fret] = true;
				if(Object.keys(fingerFrets[stringAction.finger]).length > 1) {
					return "Finger on multiple frets";
				}
			}
			
			//Check if this string is at the root fret
			if(stringAction.fret === ROOT_FRET) {
				containsRootFret = true;
			}
		}
		
		//There must be at least one string with the root fret
		if(! containsRootFret) {
			return "No root string";
		}
		
		//min <= max
		if(shape.range.min > shape.range.max) {
			return "min > max";
		}
		
		//Either an open or min > 0
		if(! (isOpenShape || shape.range.min > OPEN_FRET)) {
			return "A movable shape cannot be played in open position";
		}
		
		//Valid
		return true;
	}
	
	/**
	 * Convert a string to a shape
	 */
	shapeFromString(string, id=null) {
		let shapeProperties = string.split(":");
		let rangeProperties = shapeProperties[1].split(";");
		let strings = shapeProperties[0]
			.split(";")
			.map(stringActionProperties => {
				let stringAction = stringActionProperties.split(",");
				return StringAction.WithFretAndFinger(
					stringAction[0] === "" ? null : parseInt(stringAction[0]),
					stringAction[1] === "" ? null : parseInt(stringAction[1])
				);
			});
		let range = new Range(
			rangeProperties[0] == "" ?
				null :
				parseInt(rangeProperties[0]),
			rangeProperties[1] == "" ?
				null :
				parseInt(rangeProperties[1])
		);
		return new Shape(id, strings, range);
	}
	
	shapesFromString(string) {
		return string.length === 0 ?
			[] :
			string.split(/\r?\n/).map(this.shapeFromString);
	}
	
	/**
	 * Convert a shape to a string
	 */
	shapeToString(shape) {
		return shape.strings.map(stringAction =>
			(stringAction.fret === null ? "" : stringAction.fret) + "," +
			(stringAction.finger === null ? "" : stringAction.finger)
		).join(";") +
		":" +
		(shape.range.min === null ? "" : shape.range.min + ";") +
		(shape.range.max === null ? "" : shape.range.max + ";");
	}
	
	shapesToString(shapes) {
		return shapes.map(this.shapeToString).join("\r\n");
	}
	
	loadFromLocalStorage() {
		let shapeString = localStorage.getItem(this.LOCAL_STORAGE_KEY);
		this.shapes = shapeString === null || shapeString.length === 0 ?
			[] : this.shapes = this.shapesFromString(shapeString);
	}
	
	async saveToLocalStorage() {
		localStorage.setItem(
			this.LOCAL_STORAGE_KEY,
			this.shapesToString(this.shapes)
		);
	}
	
	mergeShapeLists(a, b) {
		let merged = a.slice();
		for(let bShape of b) {
			let unique = true;
			for(let aShape of merged) {
				if(this.equals(bShape, aShape)) {
					unique = false;
					break;
				}
			}
			if(unique) {
				merged.push(bShape);
			}
		}
		return merged;
	}
	
	importShapes(files) {
		new ShapeFileLoader(
			files,
			shapesInFile => {
				this.shapes = this.mergeShapeLists(this.shapes, shapesInFile);
				this.saveToLocalStorage();
			}
		);
	}
	
	overwriteShapes(files) {
		new ShapeFileLoader(
			files,
			shapesInFile => {
				this.shapes = shapesInFile;
				this.saveToLocalStorage();
			}
		);
	}
	
	redirectToShapesFile() {
		//Convert the shapes to a text string and open in a new tab
		let tempLink = document.createElement('a');
		tempLink.setAttribute(
			'href',
			'data:text/plain;charset=utf-8,' +
				encodeURIComponent(this.shapesToString(this.shapes))
		);
		tempLink.setAttribute('download', "library.shapes");
		tempLink.style.display = 'none';
		document.body.appendChild(tempLink);
		tempLink.click();
		document.body.removeChild(tempLink);
	}
}

const shapeService = new ShapeService();