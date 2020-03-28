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
		//Are the schemas the same?
		for(let i = 0; i < NUM_STRINGS; ++i) {
			var aStringAction = a.schema[i];
			var bStringAction = b.schema[i];
			for(let j = 0; j < aStringAction.length; ++j) {
				if(aStringAction[j] != bStringAction[j]) {
					//Different string action value
					return false;
				}
			}
		}
		
		//Equal
		return true;
	}
	
	isOpenShape(shape) {
		return 0 === shape.range[0] && 0 === shape.range[1];
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
				const shape = this.getShape(
					Math.floor(
						Math.random() * this.shapes.length
					)
				);
				candidate = {
					shape: shape,
					fret: Math.floor(
						Math.random() * 
						(shape.range[1] - shape.range[0]) +
						shape.range[0]
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
	 * @param frets An array of 6 fret values. Can contain ANY_FRET on any string.
	 */
	getShapesByFrets(frets) {
		//Filter the shapes
		return this.shapes.filter(shape => {
			//For each string
			for(let string = 0; string < NUM_STRINGS; ++string) {
				//Does search match the fret for this shape's string?
				if(
					frets[string] !== ANY_FRET &&
					shape.schema[string][1] !== frets[string]
				) {
					//No. This shape is not a match.
					return false;
				}
				//Yes. Check next string.
			}
			
			//All strings match.
			//This shape is a match.
			return true;
		});
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
		for(let string = 0; string < shape.schema.length; ++string) {
			let finger = shape.schema[string][0];
			let fret = shape.schema[string][1];
			
			//Every dead string must have no finger
			if(
				fret === DEAD_STRING &&
				finger !== NO_FINGER
			) {
				return "Dead string has finger";
			}
			
			//If this is a non-dead string with no fingers, then
			//	a) Must be an open shape, and
			//	b) Must be the root fret.
			if(
				fret !== DEAD_STRING &&
				finger === NO_FINGER && ! (
					isOpenShape &&
					fret === ROOT_FRET
				)
			) {
				return "Finger missing";
			}
			
			//A finger can be placed on at most one fret
			if(finger !== null && fret !== null) {
				fingerFrets[finger][fret] = true;
				if(Object.keys(fingerFrets[finger]).length > 1) {
					return "Finger on multiple frets";
				}
			}
			
			//Check if this string is at the root fret
			if(fret === ROOT_FRET) {
				containsRootFret = true;
			}
		}
		
		//There must be at least one string with the root fret
		if(! containsRootFret) {
			return "No root string";
		}
		
		//min <= max
		if(shape.range[0] > shape.range[1]) {
			return "min > max";
		}
		
		//Either an open or min > 0
		if(! (isOpenShape || shape.range[0] > OPEN_FRET)) {
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
				
		let stringActions = new Array();
		let stringActionProperties = shapeProperties[0].split(";");
		for(let j = 0; j < stringActionProperties.length; ++j) {
			let stringAction = stringActionProperties[j].split(",");
			stringActions.push(
				new Array(
					stringAction[0] === "" ? null : parseInt(stringAction[0]),
					stringAction[1] === "" ? null : parseInt(stringAction[1])
				)
			);
		}
		
		let range = new Array();
		let rangeProperties = shapeProperties[1].split(";");
		range.push(
			rangeProperties[0] == "" ?
				null :
				parseInt(rangeProperties[0])
		);
		range.push(
			rangeProperties[1] == "" ?
				null :
				parseInt(rangeProperties[1])
		);
		
		return new Shape(id, stringActions, range);
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
		return shape.schema.map(stringAction =>
			stringAction.map(value =>
				value == null ? "" : value
			).join(',')
		).join(";") +
		":" +
		shape.range.map(value =>
			value == null ? "" : value
		).join(';');
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