/*
	sequence dialog and tv scenes
	A - hungry
	B - tv
	C - convo about tv -> back to A
*/

function Sequencer(catText, dogText, changeScene) {

	const parts = [];
	let index = 0;
	let count = 0;
	let delay = 2; // units?
	let isActive = false;
	let currentText, currentSpeaker, nextDelay;
	let currentDialog = 'start'; // start, new
	let speakers = {
		cat: catText,
		dog: dogText,
	};

	const voices = {};
	let voiceSynth;

	/* add initial dialog, return here after each run through */
	startDialog();
	// nextPart();

	// load grammar to use later
	let grammarsLoaded = false;

	let codexURL = './public/grammars/CODEX-cfg.json';
	let mysteryURL = './public/grammars/The_Mystery_of_the_Apocalypse-cfg.json';
	let cfg = new CFGGenerator({
		tagChance: 1,
		filterChance: 1,
	});

	async function loadGrammarFiles() {
		const codexFile = await fetch(codexURL).then(response => response.json());
		const mysteryFile = await fetch(mysteryURL).then(response => response.json());

		cfg.feed('cat', mysteryFile);
		cfg.feed('dog', codexFile);
	}
	loadGrammarFiles();

	function setupVoice() {
		if (!window.speechSynthesis) return;
		voiceSynth = window.speechSynthesis;
		voiceSynth.onvoiceschanged = function() {
			const voiceList = voiceSynth.getVoices();
			const fred = voiceList.find(v => v.name === 'Fred');
			const victoria = voiceList.find(v => v.name === 'Victoria');
			voices.cat = victoria ? victoria : voiceList[1];
			voices.dog = fred ? fred : voiceList[0];
		};
	}

	function getRandomDelay(min, max) {
		return Cool.randomInt(min || 1, max || 2);
	}

	function startDialog() {
		currentDialog = 'start';
		const [speaker1, speaker2] = Cool.shuffle(['cat', 'dog']);
		currentText = speakers[speaker1];

		let cycle = [];
		cycle.push( "I'm hungry." );
		cycle.push( "Me too." );
		cycle.push( "When will we eat again?" );
		cycle.push( "I don't know." );
		cycle.push( "Should we watch some tv?" );

		for (let i = 0; i < cycle.length; i++) {
			parts.push({
				text: cycle[i],
				speaker: i % 2 === 0 ? speaker1 : speaker2,
			});
		}
	}

	function newDialog() {
		currentDialog = 'new';
		const [speaker1, speaker2] = Cool.shuffle(['cat', 'dog']);
		currentText = speakers[speaker1];

		let cycle = [];

		cycle.push( "What do you think that was about?" );
		cycle.push(	cfg.getSentence(speaker2, 'C', { 'C': [["I think it was about", "DT", "NN", "of", "NN", "."]] }) );
		cycle.push( cfg.getSentence(speaker1, 'C', { 'C': [["You don't think it was about", "Q"]] }) );
		cycle.push( cfg.getSentence(speaker2, 'C', { 'C': [["I guess it could be", "S"]] }) );
		
		let randomDialogs = Cool.choice([1, 3, 5]);
		for (let i = 0; i < randomDialogs; i++) {
			const speaker = i % 2 === 0 ? speaker1 : speaker2;
			cycle.push( cfg.getSentence(speaker, 'C', { 'C': [Cool.choice(['S', 'S', 'E', 'F', 'Q'])] }) );
		}

		cycle.push( cfg.getSentence(speaker1, 'C', { 'C': [["I don't think we really know what it was about."]] }) );

		console.log(cycle);

		for (let i = 0; i < cycle.length; i++) {
			parts.push({
				text: cycle[i],
				speaker: i % 2 === 0 ? speaker1 : speaker2,
			});
		}

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
			if (currentDialog === 'start') {

				// newDialog after three scene ...
				currentSpeaker = false;
				newDialog();
				
				// start three js scene here
				isActive = false;
				return true;
			
			} else if (currentDialog === 'new') {
				currentSpeaker = false;
				startDialog();
			}
		}

		if (!currentSpeaker) {
			// set speaking character and new dialog
			const part = parts.shift();
			nextDelay = getRandomDelay();
			currentSpeaker = part.speaker;
			currentText = speakers[part.speaker];
			currentText.isActive = true;
			currentText.setMsg(part.text);
			changeScene(currentSpeaker, true);
			
			// voice
			if (voiceSynth && voices[part.speaker]) {
				const utterance = new SpeechSynthesisUtterance(part.text);
				utterance.rate = 0.75;
				utterance.voice = voices[part.speaker];
				voiceSynth.speak(utterance);
			}

		}
		
		const speakerIsFinished = currentText.display();
		if (!speakerIsFinished) return false;
		if (speakerIsFinished) {
			// wait for delay before switching again
			delay = nextDelay;
			count = 0;
			currentText.isActive = false;
			changeScene(Cool.random(['cat', 'dog', 'tv', 'main']), false);
			currentSpeaker = false;
		}
	}

	return { 
		update, 
		setupVoice,
		isActive() { return isActive; },
		start() { isActive = true; }
	};
}