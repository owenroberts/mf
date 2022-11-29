/*
	three stuff
*/

function ThreeScene() {

	let isActive = false;
	const canvas = document.getElementById('three');
	const w = 960, h = 720;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera( 75, w / h, 0.1, 1000 );

	const renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		alpha: true,
	});
	renderer.setSize( w, h );
	document.body.appendChild( renderer.domElement );

	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
	const cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 5;

	const loader = new THREE.GLTFLoader().setPath( './public/models/' );
	loader.load( 'cat1.glb', gltf => {
		scene.add( gltf.scene );
	} );

	function animate() {
		if (isActive) {
			requestAnimationFrame( animate );

			cube.rotation.x += 0.01;
			cube.rotation.y += 0.01;

			renderer.render( scene, camera );
		}
	}

	return {
		start() {
			isActive = true;
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

