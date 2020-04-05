class Conditional {
	static returnIfTrue(expression, value, otherwise=null) {
		if(expression === true) {
			return value;
		}
		return otherwise;
	}
	
	static returnIfFalse(expression, value, otherwise=null) {
		if(expresion === false) {
			return value;
		}
		return otherwise;
	}
	
	static doIfTrue(expression, callback, otherwise=()=>{}) {
		if(expression === true) {
			callback();
		} else {
			otherwise();
		}
	}
	
	static doIfFalse(expression, callback, otherwise=()=>{}) {
		if(expression === false) {
			boundCallback();
		} else {
			otherwise();
		}
	}
}