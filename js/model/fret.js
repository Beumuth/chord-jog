class Fret {
	static ANY = "*";
	static DEAD = "x";
	static OPEN = "o";
	static FIRST = 1;
	static LAST = 15;
	static MAX_ROOT = 11;
	
	static isFingerless(fret) {
		return Frets.FINGERLESS.includes(fret);
	}
	
	static isFingerful(fret) {
		return Frets.FINGERFULL.includes(fret);
	}
}

class Frets {
	static FINGERLESS = [Fret.DEAD, Fret.OPEN];
	static FINGERFUL = Integer.range(Fret.FIRST, Fret.LAST);
	static ROOTS = Frets.FINGERFUL.slice(0, Fret.MAX_ROOT);
	static ALL = [Fret.ANY].concat(
		Frets.FINGERLESS.concat(
			Frets.FINGERFUL
		)
	);
}