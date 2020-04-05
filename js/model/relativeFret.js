class RelativeFret {
	static ANY = "*";
	static ROOT = 0;
	static MAX = 5;
}

class RelativeFrets {
	static FINGERLESS = [Fret.DEAD, Fret.OPEN];
	static FINGERFUL = Integer.range(
		RelativeFret.ROOT,
		RelativeFret.MAX
	);
	static ALL = [RelativeFret.ANY].concat(
		RelativeFrets.FINGERLESS.concat(
			RelativeFrets.FINGERFUL
		)
	);
}