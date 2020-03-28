var chordJogView;
const SPACE_CODE = 32;

class ChordJogView {
	constructor() {
		if(chordJogView) {
			return chordJogView;
		}
		this.shapeService = new ShapeService();
		chordJogView = this;
	}
	
	selectNumChordsOption(numChordsOption) {
		$(".numChordsOption[data-selected='true']").attr("data-selected", "false");
		$(numChordsOption).attr("data-selected", "true");
	}
	
	rerollChords() {
		this.guitarClient.nRandomGuitarChords(
			$(".numChordsOption[data-selected='true']").text(),
			(this.rerollChordsCallback).bind(this)
		);
	}
	
	rerollChordsCallback(guitarChords) {
		$("#chordChartContainer").empty();
		guitarChordViews = [];
		for(var i = 0; i < guitarChords.length; ++i) {
			guitarChordViews.push(this.guitarChordViewService.createGuitarChordView(guitarChords[i]));
		}
		$("#chordChartContainer").append(guitarChordViews);
	}
	
	controlOnKeyDown(e) {
		if(e.keyCode == SPACE_CODE) {
			event.preventDefault();
		}
	}
	
	controlOnKeyUp(e) {
		if(e.keyCode == SPACE_CODE) {
			this.selectNumChordsOption(e.target);
		}
	}
	
	rerollOnKeyDown(e) {
		if(e.keyCode == SPACE_CODE) {
			event.preventDefault();
			$("#rerollButton").toggleClass("active", true);
		}
	}
	
	rerollOnKeyUp(e) {
		$("#rerollButton").toggleClass("active", false);
		if(e.keyCode == SPACE_CODE) {
			this.rerollChords();
		}
	}
}