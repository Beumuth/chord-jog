class Integer {
	static range(from, to) {
		const array = [];
		for(let i = from; i < to; ++i) {
			array.push(i);
		}
		return array;
	}
	
	static numDigits(integer) {
		//Credit: https://stackoverflow.com/a/14879700/13172428
		return Math.log(number) * Math.LOG10E + 1 | 0;
	}
}