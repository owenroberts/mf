/*
	three stuff
*/

function ThreeScene() {

	let isActive = false;
	const canvas = document.getElementById('three');
	const w = 960, h = 720;

	const renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		// alpha: true,
		antialias: true,
	});
	renderer.setSize( w, h );
	document.body.appendChild( renderer.domElement );
	// renderer.outputEncoding = THREE.sRGBEncoding;
	// renderer.toneMapping = THREE.ACESFilmicToneMapping;
	// renderer.toneMappingExposure = 1;

	const scene = new THREE.Scene();

	// const pmremGenerator = new THREE.PMREMGenerator( renderer );
	// scene.environment = pmremGenerator.fromScene( new THREE.RoomEnvironment(), 0.04 ).texture;

	// lights
	const camera = new THREE.PerspectiveCamera( 75, w / h, 0.1, 1000 );
	camera.position.z = 7;

	// const camera = new THREE.OrthographicCamera( w / 80 / - 2, w / 80 / 2, h / 80 / 2, h / 80 / - 2, 1, 1000 );
	// camera.position.z = 10;

	const ambientLight = new THREE.AmbientLight( 0x2e2e2e, 1 );
	scene.add(ambientLight);

	const pointLightBack = new THREE.PointLight( 0xffffff, 1 );
	pointLightBack.position.set(0, 0, -10);
	scene.add(pointLightBack);

	const pointLightFront = new THREE.PointLight( 0xffffff, 0.75 );
	pointLightFront.position.set(0, 0, 10);
	scene.add(pointLightFront);

	// fx
	const composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );

	const effect1 = new THREE.ShaderPass( THREE.DotScreenShader );
	effect1.uniforms[ 'scale' ].value = 5;
	// composer.addPass( effect1 );

	const effect2 = new THREE.ShaderPass( THREE.RGBShiftShader );
	effect2.uniforms[ 'amount' ].value = 0.0045;
	// composer.addPass( effect2 );

	const params = {
		shape: 1,
		radius: 4,
		rotateR: Math.PI / 12,
		rotateB: Math.PI / 12 * 2,
		rotateG: Math.PI / 12 * 3,
		scatter: 0,
		blending: 0.25,
		blendingMode: 1,
		greyscale: false,
		disable: false
	};
	const halftonePass = new THREE.HalftonePass( w, h, params );
	composer.addPass( halftonePass );

	// bg
	const floorGeo = new THREE.PlaneGeometry( 50, 50 );
	const floorMat = new THREE.MeshPhongMaterial({ 
		color: 0x111111,
	});
	const floorMesh = new THREE.Mesh( floorGeo, floorMat );
	floorMesh.position.set(0, 0, -4);
	scene.add(floorMesh);

	const loadingManager = new THREE.LoadingManager();
	const loader = new THREE.GLTFLoader( loadingManager ).setPath( './public/models/' );
	let catModel, dogModel, tvModel;
	let catMixer, dogMixer, tvMixer;
	let chars = {
		cat: { url: 'cat2.glb', index: 1 },
		dog: { url: 'dog2.glb', index: 2 },
		tv: { url: 'tv2.glb',  index: 0 },
	};

	for (const key in chars) {
		const char = chars[key];
		loader.load( char.url, gltf => {
			char.model = gltf.scene;
			scene.add( char.model );
			char.mixer = new THREE.AnimationMixer( char.model );
			const clips = gltf.animations;
			const clip = THREE.AnimationClip.findByName( clips, 'Talking' );
			const action = char.mixer.clipAction( clip );
			action.play();
		} );
	}

	const letterModels = {};
	loader.load( 'letters.glb' , gltf => {
		gltf.scene.children.forEach(child => {
			letterModels[child.name] = child;
		});
	});

	loadingManager.onLoad = () => {
		console.log('models loaded');
		// setup();
	};

	let models = [];
	let rotators = [];
	let clouds = [];

	const letterGroup = new THREE.Group();
	scene.add( letterGroup );

	function Rotator( model, group ) {

		let rotate = Cool.choice([true, false]);

		let rx = rotate ? Cool.random(0.0001, 0.01) : 0;
		let ry = rotate ? Cool.random(0.0001, 0.01) : 0;
		let rz = rotate ? Cool.random(0.0001, 0.01) : 0;

		let move = Cool.choice([true, false]);
		let wait = Cool.randomInt(50, 100);
		let count = 0;

		let dir = Cool.choice(['x', 'y', 'z']);
		let ms = Cool.random(-0.01, 0.01);

		if (!move && !rotate && group) {

			let left = model.clone();
			let right = model.clone();
			left.position.x -= 1;
			right.position.x += 1;

			let rz = Cool.random(Math.PI * 2);
			model.rotation.z = rz;
			left.rotation.z = rz;
			right.rotation.z = rz;

			group.add(left);
			group.add(right);
		}

		return {
			update() {
				if (rotate) {
					model.rotation.x += rx;
					model.rotation.y += ry;
					model.rotation.z += rz;
				}

				if (move) {
					if (count < wait) {
						count++;
					} else {
						model.position[dir] += ms;
					}

				}
			}
		}
	}

	function Cloud( model, material ) {
		const clustNum = Cool.randomInt(1, 3);
		const cloudGroup = new THREE.Group();
		for (let i = 0; i < clustNum; i++) {
			const c = model.clone();
			c.material = material;
			c.rotation.set(
				Cool.random(Math.PI * 2), 
				Cool.random(Math.PI * 2), 
				Cool.random(Math.PI * 2),
			);
			c.position.set(
				Cool.random(-0.5, 0.5),
				Cool.random(-0.5, 0.5),
				Cool.random(-0.5, 0.5),
			);
			cloudGroup.add(c);
			scene.add(cloudGroup);
		}

		cloudGroup.position.x = Cool.random(-10, 10);
		cloudGroup.position.y = Cool.random(3, 4);
		let x = Cool.random(0.001, 0.01);

		return {
			update() {
				cloudGroup.position.x += x;
				if (cloudGroup.position.x > 10) {
					cloudGroup.position.x = -10;
				}
			}
		}
	}

	function setup() {

		rotators = [];

		for (let i = letterGroup.children.length - 1; i >= 0; i--) {
			scene.remove( letterGroup.children[i] );
			letterGroup.remove( letterGroup.children[i] );
		}

		const letterList = Object.keys( letterModels );
		const objIndexes = Cool.shuffle( [0, 1, 2, 3, 4, 5, 6, 7, 8] );

		// letter grid

		let cols = Cool.randomInt(2, 4);
		let rows = Cool.randomInt(2, 4);
		let w = 5;
		let h = 4;
		let cw = w * 2 / cols;
		let rh = h * 2 / rows;

		let layers = Cool.randomInt(1, 3);

		const letterMaterial = getRandomMaterial();
		for (let i = 0; i <= cols; i++) {
			for (let j = 0; j <= rows; j++) {
				
				const x = i * cw - w;
				const y = j * rh - h;
				const z = 0; // l * -2;

				let doContinue = false;
				for (const key in chars) {
					const { index, model } = chars[key];
					if (objIndexes[index] === i + j * 3) {
						model.position.set( x, y, z );
						model.rotation.set( 0, 0, 0 ); // reset
						model.traverse( child => {
							if ( child.material ) child.material = letterMaterial;
						});
						rotators.push( Rotator(model ) );
						doContinue = true;
					}
				}

				if ( doContinue ) continue;

				const letter = Cool.choice( Object.keys( letterModels ) );
				const letterMesh = letterModels[letter].clone();
				letterMesh.material = letterMaterial;
				letterMesh.position.set(x, y, z);
				letterGroup.add( letterMesh );
				rotators.push( Rotator( letterMesh, letterGroup ) );
			}
		}

		// clouds
		// const cloudLetter = Cool.choice(letterList);
		// const cloudMaterial = getRandomMaterial();
		// for (let x = -5; x <= 5; x += 2) {
			// clouds.push(Cloud(letterModels[cloudLetter], cloudMaterial));
		// }

	}

	function getRandomMaterial() {
		let color = new THREE.Color();
		// color.setHex(0x7d7d7d + Math.random() * 0xdcdcdc);
		color.setRGB(
			Cool.random(0.5, 0.7),
			Cool.random(0.7, 0.8),
			Cool.random(0.7, 0.9),
		);
		let material = new THREE.MeshStandardMaterial({ 
			color: color.getHex()
		});
		return material;
	}

	const clock = new THREE.Clock();
	let delta;
	function animate() {
		
		if (isActive) {
			requestAnimationFrame( animate );
			delta = clock.getDelta();
			
			for (let i = 0, len = rotators.length; i < len; i++) {
				rotators[i].update();
			}

			for (let i = 0, len = clouds.length; i < len; i++) {
				clouds[i].update();
			}

			for (const key in chars) {
				chars[key].mixer.update( delta );
			}

			// renderer.render( scene, camera );
			composer.render();
		}
	}

	return {
		start() {
			isActive = true;
			setup();
			animate();
			canvas.classList.add('active');
		},
		stop() {
			isActive = false;
			canvas.classList.remove('active');
		},
		isActive() {
			return isActive;
		}
	}
}

