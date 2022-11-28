/*
	sequence dialog and tv scenes
	A - hungry
	B - tv
	C - convo about tv -> back to A
*/

function Sequencer(catText, dogText, changeScene) {

	// get grammars

	const parts = [];
	let index = 0;
	let count = 0;
	let delay = 2; // units?
	let isActive = false;
	let currentText, currentSpeaker, nextDelay;
	let speakers = {
		cat: catText,
		dog: dogText,
	};

	/* add initial dialog, return here after each run through */
	startDialog();
	// nextPart();

	// load grammar to use later
	let grammarsLoaded = false;

	let cfgURL = './text_tools/data/FEAR_AND_TREMBLING-cfg.json';
	let cfg = new CFGGenerator();

	async function loadGrammarFiles() {
		const cfgFile = await fetch(cfgURL).then(response => response.json());
		cfg.feed('cat', cfgFile);
		cfg.feed('dog', cfgFile);
		console.log(cfg);
		console.log(cfg.getText('cat', 'S', { 'S': [['I', 'VB', 'a', 'NN']] }));
		// console.log(cfg.getText('dog'));

	}
	loadGrammarFiles();

	function startDialog() {
		const start = Cool.choice(['cat', 'dog']);

		const [speaker1, speaker2] = Cool.shuffle(['cat', 'dog']);
		currentText = speakers[speaker1];

		parts.push({
			speaker: speaker1,
			text: "I'm hungry.",
			delay: Cool.randomInt(2, 4),
		});

		parts.push({
			speaker: speaker2,
			text: "Me too.",
			delay: Cool.randomInt(2, 4),
		});

		parts.push({
			speaker: speaker1,
			text: "When will we eat again?",
			delay: Cool.randomInt(2, 4),
		});

		parts.push({
			speaker: speaker2,
			text: "I don't know.",
			delay: Cool.randomInt(2, 5),
		});

		parts.push({
			speaker: speaker1,
			text: "Should we watch some tv?",
			delay: Cool.randomInt(2, 5),
		});
	}

	function nextPart() {
		const part = parts.shift();
		currentSpeaker = part.speaker;
		currentText = speakers[part.speaker];
		currentText.setMsg(part.text);
		delay = part.delay;
	}

	function update(timeElapsed) {
		if (count <= delay) return count += timeElapsed / 1000;

		if (!currentSpeaker && parts.length === 0) {
			isActive = false;
			return true;
		}

		// if (voices.length === 0) count = -1; // ?
		if (!currentSpeaker) {
			// set speaking character and new dialog
			const part = parts.shift();
			nextDelay = part.delay;
			currentSpeaker = part.speaker;
			currentText = speakers[part.speaker];
			currentText.isActive = true;
			currentText.setMsg(part.text);
			changeScene(currentSpeaker, true);
			// voice
		}
		
		const speakerIsFinished = currentText.display();
		if (!speakerIsFinished) return false;
		if (speakerIsFinished) {
			// wait for delay before switching again
			delay = nextDelay;
			count = 0;
			currentText.isActive = false;
			changeScene(Cool.random(['cat', 'dog', 'tv', 'main']), false);
			currentSpeaker = undefined;
		}
	}

	return { 
		update, 
		isActive() { return isActive; },
		start() { isActive = true; }
	};
}