class ShapeService {
	static MAX_SEARCH_RESULTS = 12;
	
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
			if(! StringAction.equals(a.strings[i], b.strings[i])) {
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
		const fixedShapes = new Array();
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
		const matches = [];
		
		//For each shape
		for(
			let i = 0;
			i < this.shapes.length &&
				matches.length < ShapeService.MAX_SEARCH_RESULTS;
			++i
		) {
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
		const idOfShape = this.getIdOfShape(shape);
		if(idOfShape !== null && idOfShape !== id) {
			return "Already exists";
		}
		
		let containsRootFret = false;
		const fingerActions = shape.fingerActions();
		
		//Does the unknown finger have any finger actions?
		if(
			FingerActions
				.withFinger(fingerActions, Finger.UNKNOWN_FINGER)
				.length !== 0
		) {
			//Yes. A finger is missing.
			return "Finger missing";
		}
		
		for(let finger in Finger.ALL_FINGERS) {
			let fingerActionsForFinger = FingerActions.withFinger(
				fingerActions,
				finger
			);
			
			//Is this finger used?
			if(fingerActionsForFinger.length == 0) {
				//No, check next.
				continue;
			}
			
			//A finger can be placed on at most one fret
			if(fingerActionsForFinger.length > 1) {
				return "Finger on multiple frets";
			}
			
			//Check if this string is at the root fret
			if(fingerActionsForFinger[0].fret === ROOT_FRET) {
				containsRootFret = true;
			}
		}
		
		//There must be at least one string with the root fret
		if(! containsRootFret) {
			return "No root fret";
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
		const shapeProperties = string.split(":");
		const rangeProperties = shapeProperties[1].split(";");
		const strings = shapeProperties[0]
			.split(";")
			.map(StringAction.fromString);
		const range = new Range(
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
		return shape.strings.map(StringAction.toString).join(";") +
			":" +
			(shape.range.min === null ? "" : shape.range.min + ";") +
			(shape.range.max === null ? "" : shape.range.max + ";");
	}
	
	shapesToString(shapes) {
		return shapes.map(this.shapeToString).join("\r\n");
	}
	
	loadFromLocalStorage() {
		const shapeString = localStorage.getItem(this.LOCAL_STORAGE_KEY);
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
		const merged = a.slice();
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
		const tempLink = document.createElement('a');
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