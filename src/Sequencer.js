/*
	sequence dialog and tv scenes
	A - hungry
	--> tv
	B - convo about tv -> back to A
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
	// startDialog();
	// nextPart();
	

	// load grammar to use later
	let grammarsLoaded = false;

	let codexURL = './public/grammars/CODEX-cfg.json';
	let mystyURL = './public/grammars/The_Mystery_of_the_Apocalypse-cfg.json';
	let cycleURL = './public/grammars/cycle.json';
	let cycleFile;
	let cfg = new CFGGenerator({
		tagChance: 1,
		filterChance: 1,
	});

	async function loadGrammarFiles() {
		const codexFile = await fetch(codexURL).then(res => res.json());
		const mystyFile = await fetch(mystyURL).then(res => res.json());
		cycleFile = await fetch(cycleURL).then(res => res.json());
		// console.log(cycleFile);
		
		cfg.feed('cat', mystyFile);
		cfg.feed('cat', cycleFile, false);
		cfg.feed('dog', codexFile);
		cfg.feed('dog', cycleFile, false);

		getDialog('A');
		// let aDialog = Cool.choice(cycleFile.A).map(tag => cfg.getSentence('cat', tag, true));
		// let catDialog = Cool.choice(cycleFile.B).map(tag => cfg.getSentence('cat', tag, true));
		// let dogDialog = Cool.choice(cycleFile.B).map(tag => cfg.getSentence('dog', tag, true));

		// catDialog.forEach(s => console.log(s));
		// dogDialog.forEach(s => console.log(s)):

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

	function getDialog(start) {
		currentDialog = start;
		const [speaker1, speaker2] = Cool.shuffle(['cat', 'dog']);
		currentText = speakers[speaker1];

		let cycle = Cool.choice(cycleFile[start]);

		for (let i = 0; i < cycle.length; i++) {
			let speaker = i % 2 === 0 ? speaker1 : speaker2;
			let text = cfg.getSentence(speaker, cycle[i], true);
			parts.push({ text, speaker });
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
			if (currentDialog === 'A') {

				// newDialog after three scene ...
				currentSpeaker = false;
				// newDialog();
				getDialog('B');
				
				// start three js scene here
				isActive = false;
				return true;
			
			} else if (currentDialog === 'B') {
				currentSpeaker = false;
				getDialog('A');
			}
		}

		if (!currentSpeaker) {
			// set speaking character and new dialog
			const part = parts.shift();
			nextDelay = getRandomDelay();
			// part.speaker undefined ...
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