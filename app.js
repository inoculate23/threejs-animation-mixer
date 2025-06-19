var APP = {

	Player: function () {

		var renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio ); // TODO: Use player.setPixelRatio()

		var loader = new THREE.ObjectLoader();
		var camera, scene;

		var events = {};

		var dom = document.createElement( 'div' );
		dom.appendChild( renderer.domElement );

		this.dom = dom;
		this.canvas = renderer.domElement;

		this.width = 500;
		this.height = 500;

		this.load = function ( json ) {

			var project = json.project;

			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				pointerdown: [],
				pointerup: [],
				pointermove: [],
				update: []
			};

			var scriptWrapParams = 'player,renderer,scene,camera';
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( 'uuid', uuid, true );

				if ( object === undefined ) {

					console.warn( 'APP.Player: Script without object.', uuid );
					continue;

				}

				var scripts = json.scripts[ uuid ];

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( 'APP.Player: Event type not supported (', name, ')' );
							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}

			dispatch( events.init, arguments );

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};

this.setScene = function ( value ) {

	scene = value;
	let object = value; // Store the loaded object for later use

	// Removed: scene.add(object); // Prevent adding scene as its own child

	// Animation setup after object is loaded
	// Create an AnimationMixer
	if (object) {
		const mixer = new THREE.AnimationMixer(object);

		// Try to find animation clips in the object or its children
		let clips = [];
		if (object.animations && object.animations.length > 0) {
			clips = object.animations;
		} else {
			// Traverse children to find animations
			object.traverse(function(child) {
				if (child.animations && child.animations.length > 0) {
					clips = clips.concat(child.animations);
				}
			});
		}

		if (clips.length > 0) {
			// Play all found clips
			clips.forEach(function(clip) {
				const action = mixer.clipAction(clip);
				action.play();
			});
			// Store the mixer for use in the animation loop
			object.mixer = mixer;
		} else {
			console.warn('No animation clips found in the loaded object or its children.');
			// Do not return; allow the rest of the scene setup to continue
		}
	}
};

		this.setPixelRatio = function ( pixelRatio ) {

			renderer.setPixelRatio( pixelRatio );

		};

this.setSize = function ( width, height ) {

	renderer.setSize( width, height );
	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	this.width = width;
	this.height = height;

};

// Animation loop
const clock = new THREE.Clock(); // To track time delta

// Define missing variables
let startTime = 0;
let prevTime = 0;

// Define dispatch function
function dispatch( array, event ) {
	for ( let i = 0, l = array.length; i < l; i ++ ) {
		array[ i ]( event );
	}
}

function animate() {
	const delta = clock.getDelta();

	// Update the mixer if it exists on the object
	if (scene) {
		scene.traverse(function (child) {
			if (child.mixer) {
				child.mixer.update(delta);
			}
		});
	}

	let time = performance.now();

	try {

		dispatch( events.update, { time: time - startTime, delta: time - prevTime } );

	} catch ( e ) {

		console.error( ( e.message || e ), ( e.stack || '' ) );

	}

	renderer.render( scene, camera );

	prevTime = time;

}

		this.play = function () {

			startTime = prevTime = performance.now();

			document.addEventListener( 'keydown', onKeyDown );
			document.addEventListener( 'keyup', onKeyUp );
			document.addEventListener( 'pointerdown', onPointerDown );
			document.addEventListener( 'pointerup', onPointerUp );
			document.addEventListener( 'pointermove', onPointerMove );

			dispatch( events.start, arguments );

			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			document.removeEventListener( 'keydown', onKeyDown );
			document.removeEventListener( 'keyup', onKeyUp );
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointermove', onPointerMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.render = function ( time ) {

			dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );

			renderer.render( scene, camera );

		};

		this.dispose = function () {

			renderer.dispose();

			camera = undefined;
			scene = undefined;

		};

		//

		function onKeyDown( event ) {

			dispatch( events.keydown, event );

		}

		function onKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		function onPointerDown( event ) {

			dispatch( events.pointerdown, event );

		}

		function onPointerUp( event ) {

			dispatch( events.pointerup, event );

		}

		function onPointerMove( event ) {

			dispatch( events.pointermove, event );

		}

	}
}



export { APP };
