class Integer {
	static range(from, to) {
		let array = [];
		for(let i = from; i < to; ++i) {
			array.push(i);
		}
		return array;
	}
}