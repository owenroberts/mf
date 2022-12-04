const { Game, Sprite, TextButton, TextSprite } = LinesEngine;

const lines = new Game({
	dps: 20,
	width: 960, // window.innerWidth,
	height: 720, // window.innerHeight,
	// multiColor: true,
	retina: true,
	// debug: true,
	// stats: true,
	suspend: false,
	scenes: ['loading', 'main', 'cat', 'dog', 'tv', 'start'],
	lineWidth: 1,
	events: ['mouse']
});

lines.load({
	sprites: 'public/sprites.json'
});

let cat, dog, tv, catText, dogText;
let speakers;
let catClose, dogClose, tvClose;
let sequencer;
let useSound = false;

let catTrack = 22, dogTrack = 24;
let threeScene = ThreeScene();
let doodoos = {};

/* debug */
let pause = false;
document.addEventListener('keydown', ev => {
	if (ev.which === 80) {
		console.log('pause');
		pause = !pause;
		console.log(pause);
	};

	if (Cool.keys[ev.which] === 's') {
		threeScene.start();
	}
})

lines.start = function() {

	const { sprites } = lines.anims;

	/* loading */
	const loadingText = new TextSprite({
		x: 200,
		y: 200,
		msg: "loading",
		letters: sprites.dog_letters,
		track: dogTrack,
		countForward: true,
		countBackward: true,
		repeatCount: true,
		delay: 60,
	});
	lines.scenes.loading.addToDisplay(loadingText);

	/* load doodoo comps */
	async function loadComps() {
		const mainTheme = await fetch('./public/compositions/tv1_theme.json')
			.then(res => res.json());
		const tvTheme = await fetch('./public/compositions/tv1_tv.json')
			.then(res => res.json());
		
		doodoos.main = new Doodoo({ 
			...mainTheme, 
			samplesURL: './doodoo/samples/',
			volume: -20,
			autoStart: false, 
		});
		
		doodoos.tv = new Doodoo({ 
			...tvTheme, 
			autoStart: false, 
			samplesURL: './doodoo/samples/',
			volume: -6,
		});

		doodoos.main.play();
	}

	const title = new Sprite(lines.halfWidth, 300);
	title.center = true;
	title.addAnimation(sprites.title);
	lines.scenes.start.addToDisplay(title);

	const startSoundButton = new TextButton({
		x: lines.halfWidth, 
		y: 420, 
		center: true,
		msg: 'Click to start with sound', 
		wrap: 26, 
		letters: sprites.cat_letters,
		track: catTrack,
		countForward: true,
	});
	lines.scenes.start.addUI(startSoundButton);
	startSoundButton.onClick = function() {
		lines.scenes.current = 'main';
		useSound = true;
		loadComps();
		sequencer.setupVoice();
		sequencer.start();
	};

	const startSilentButton = new TextButton({
		x: lines.halfWidth, 
		y: 500, 
		center: true,
		msg: 'Click to start without sound', 
		wrap: 29, 
		letters: sprites.cat_letters,
		track: catTrack,
		countForward: true,
	});
	lines.scenes.start.addUI(startSilentButton);
	startSilentButton.onClick = function() {
		lines.scenes.current = 'main';
		useSound = false;
		sequencer.start();
	};

	const tvFrame = new Sprite();
	tvFrame.addAnimation(sprites.tv_frame);
	lines.scenes.addToDisplay(tvFrame, ['loading', 'start', 'main', 'cat', 'dog', 'tv']);

	cat = new Sprite(500, -20);
	cat.addAnimation(sprites.cat_main);
	lines.scenes.main.addToDisplay(cat);

	dog = new Sprite(-20, 100);
	dog.addAnimation(sprites.dog_main);
	lines.scenes.main.addToDisplay(dog);

	tv = new Sprite(260, 265);
	tv.addAnimation(sprites.tv_main);
	lines.scenes.main.addToDisplay(tv);

	catClose = new Sprite(650, 320);
	catClose.center = true;
	catClose.addAnimation(sprites.cat_close);
	lines.scenes.cat.addToDisplay(catClose);

	catText = new TextSprite({
		x: 100,
		y: 100,
		letters: sprites.cat_letters,
		wrap: 12,
		track: catTrack,
		lead: 60,
		countForward: true,
		countBackward: true,
		endDelay: 20,
	});

	dogText = new TextSprite({
		x: 500,
		y: 200,
		letters: sprites.dog_letters,
		wrap: 12,
		track: dogTrack,
		lead: 60,
		countForward: true,
		countBackward: true,
		endDelay: 20,
	});

	dogClose = new Sprite(250, 350);
	dogClose.center = true;
	dogClose.addAnimation(sprites.dog_close);
	lines.scenes.dog.addToDisplay(dogClose);

	tvClose = new Sprite(lines.halfWidth, lines.halfHeight);
	tvClose.center = true;
	tvClose.addAnimation(sprites.tv_close);
	lines.scenes.tv.addToDisplay(tvClose);

	[cat, dog, tv, catClose, dogClose, tvClose].forEach(sprite => {
		for (let i = 0; i <= sprite.animation.endFrame; i++) {
			sprite.animation.createNewState(''+i, i, i);
		}
		sprite.animation.state = Cool.randomInt(0, sprite.animation.endFrame);
	});

	sequencer = Sequencer(catText, dogText, changeScene);
	speakers = { cat: catClose, dog: dogClose };
	
	lines.scenes.current = 'start';
	// console.log('lines', lines);
	// threeScene.start();
};

function changeScene(sceneType, isDialog, endDialog) {

	if (endDialog && lines.scenes.currentName === sceneType) {
		const speaker = sceneType === 'cat' ? catClose : dogClose;
		speaker.animation.state = Cool.randomInt(0, 5);
		return;
	}

	if (sceneType === 'cat') {
		const scene = isDialog ? 'cat' : Cool.choice(['cat', 'dog']);
		lines.scenes.current = scene;
		if (scene === 'cat') {
			catClose.animation.state = isDialog ? 
				Cool.randomInt(6, 10) :
				Cool.randomInt(0, 5) ;
		}

		if (scene === 'dog') {
			dogClose.animation.state = Cool.randomInt(0, 5);
		}
	}

	if (sceneType === 'dog') {
		const scene = isDialog ? 'dog' : Cool.choice(['cat', 'dog']);
		lines.scenes.current = scene;
		if (scene === 'cat') {
			catClose.animation.state = Cool.randomInt(0, 5);
		}
		if (scene === 'dog') {
			dogClose.animation.state = isDialog ?
				Cool.randomInt(6, 10):
				Cool.randomInt(0, 5);
		}
	}

	if (sceneType === 'tv') {
		lines.scenes.current = 'tv';
		tvClose.animation.state = Cool.randomInt(0, tvClose.animation.endFrame);;
	}

	if (sceneType === 'main') {
		lines.scenes.current = 'main';
		cat.state = Cool.randomInt(0, cat.animation.endFrame);
		dog.state = Cool.randomInt(0, cat.animation.endFrame);
		tv.state = Cool.randomInt(0, cat.animation.endFrame);
	}
	
}

lines.draw = function(timeElapsed) {
	if (threeScene.isActive()) return;
	lines.scenes.current.display();

	if (pause) return;
	if (sequencer.isActive()) {
		const sequenceIsFinished = sequencer.update(timeElapsed);
		if (sequenceIsFinished === true) {
			changeScene('tv');
			threeScene.start();
			if (useSound) doodoos.main.stop();
			if (useSound) doodoos.tv.play();

			let channelCount = 0;
			let channelNumber = Cool.randomInt(5, 8);
			let channelTime = Cool.randomInt(500, 3000);
			let channelInterval = setInterval(() => {
				if (channelCount <= channelNumber) {
					threeScene.start();
					channelCount++;
				} else {
					threeScene.stop();
					if (useSound) doodoos.tv.stop();
					if (useSound) doodoos.main.play();

					changeScene('main');
					setInterval(() => { sequencer.start(); }, 300);
					clearInterval(channelInterval);
				}
			}, channelTime);
		}
	}
};

lines.mouseDown = function(x, y) {
	lines.scenes.current.mouseDown(x, y);
};

lines.mouseUp = function(x, y) {
	lines.scenes.current.mouseUp(x, y);
};

lines.mouseMoved = function(x, y) {
	lines.scenes.current.mouseMoved(x, y);
};