const { Game, Sprite, TextButton, TextSprite } = LinesEngine;

const lines = new Game({
	dps: 20,
	width: 960, // window.innerWidth,
	height: 720, // window.innerHeight,
	// multiColor: true,
	retina: true,
	debug: true,
	stats: true,
	suspend: false,
	scenes: ['main', 'cat', 'dog', 'tv', 'start'],
	lineWidth: 1,
	events: ['mouse']
});

lines.load({
	sprites: 'public/sprites.json'
});

let cat, dog, tv, catText, dogText;
let catClose, dogClose, tvClose;
let sequencer;
let useSound = false;

let catTrack = 20, dogTrack = 20;;

lines.start = function() {

	const { sprites } = lines.anims;

	const startSoundButton = new TextButton({
		x: 100, 
		y: 100, 
		msg: 'Click to start with sound', 
		wrap: 20, 
		letters: sprites.cat_letters,
		track: catTrack,
		countForward: true,
		countBackward: true,
	});
	lines.scenes.start.addUI(startSoundButton);
	startSoundButton.onClick = function() {
		lines.scenes.current = 'main';
		useSound = true;
		sequencer.start();
	};

	const startSilentButton = new TextButton({
		x: 100, 
		y: 200, 
		msg: 'Click to start without sound', 
		wrap: 25, 
		letters: sprites.cat_letters,
		track: dogTrack,
		countForward: true,
		countBackward: true,
	});
	lines.scenes.start.addUI(startSilentButton);
	startSilentButton.onClick = function() {
		lines.scenes.current = 'main';
		useSound = false;
		sequencer.start();
	};

	const tvFrame = new Sprite();
	tvFrame.addAnimation(sprites.tv_frame);
	lines.scenes.addToDisplay(tvFrame, ['start', 'main', 'cat', 'dog', 'tv']);

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
	lines.scenes.current = 'start';
	console.log('lines', lines);
};

function changeScene(sceneType, isDialog) {
	console.log('change scene', sceneType, isDialog);
	if (sceneType === 'cat') {
		const scene = isDialog ? 'cat' : Cool.choice(['cat', 'dog']);
		lines.scenes.current = scene;
		if (scene === 'cat') {
			catClose.animation.state = isDialog ? 
				Cool.randomInt(5, 10) :
				Cool.randomInt(0, 4) ;

		}
		if (scene === 'dog') {
			dogClose.animation.state = Cool.randomInt(0, 4);
		}
	}

	if (sceneType === 'dog') {
		const scene = isDialog ? 'dog' : Cool.choice(['cat', 'dog']);
		lines.scenes.current = scene;
		if (scene === 'cat') {
			catClose.animation.state = Cool.randomInt(0, 4);
		}
		if (scene === 'dog') {
			dogClose.animation.state = isDialog ?
				Cool.randomInt(5, 10):
				Cool.randomInt(0, 4);
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

lines.update = function(timeElapsed) {
	// console.log('udpate', timeElapsed);
};

lines.draw = function(timeElapsed) {
	lines.scenes.current.display();

	if (sequencer.isActive()) {
		const sequenceIsFinished = sequencer.update(timeElapsed);
		if (sequenceIsFinished === true) {
			changeScene('tv');
			console.log('start three');
			// start three scene
			// start timeout to return to sequencer
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