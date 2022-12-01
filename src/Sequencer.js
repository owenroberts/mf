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

	let cfgURL = './text_tools/data/FEAR_AND_TREMBLING-cfg.json';
	let cfg = new CFGGenerator({
		tagChance: 1,
		filterChance: 1,
	});

	async function loadGrammarFiles() {
		const cfgFile = await fetch(cfgURL).then(response => response.json());
		cfg.feed('cat', cfgFile);
		cfg.feed('dog', cfgFile);
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

		parts.push({
			speaker: speaker1,
			text: "I'm hungry.",
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker2,
			text: "Me too.",
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker1,
			text: "When will we eat again?",
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker2,
			text: "I don't know.",
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker1,
			text: "Should we watch some tv?",
			delay: getRandomDelay()
		});
	}

	function newDialog() {
		currentDialog = 'new';
		const [speaker1, speaker2] = Cool.shuffle(['cat', 'dog']);
		currentText = speakers[speaker1];

		parts.push({
			speaker: speaker1,
			text: "What was the point of that?",
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker2,
			text: cfg.getText(speaker2, 'C', { 'C': [["I think it was about", "DT", "NN", "of", "NN", "."]] }).text,
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker1,
			text: cfg.getText(speaker1, 'C', { 'C': [["You don't think it was", "Q"]] }).text,
			delay: getRandomDelay()
		});

		parts.push({
			speaker: speaker2,
			text: cfg.getText(speaker2, 'C', { 'C': [["I guess it might have been", "S"]] }).text,
			delay: getRandomDelay()
		});

		// add raandom here

		parts.push({
			speaker: speaker1,
			text: cfg.getText(speaker1, 'C', { 'C': [["I don't think we really know what it was about."]] }).text,
			delay: getRandomDelay()
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
			nextDelay = part.delay;
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