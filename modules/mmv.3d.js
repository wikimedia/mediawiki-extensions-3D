/*
 * This file is part of the MediaWiki extension 3D.
 *
 * The 3D extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * The 3D extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with The 3D extension. If not, see <http://www.gnu.org/licenses/>.
 */

window.THREE = require( './lib/three/three.js' );

let singleton = false;

function ThreeD( viewer ) {
	THREE.Cache.enabled = true;

	this.viewer = viewer;
	this.progressBar = viewer.ui.panel.progressBar;
	this.$container = viewer.ui.canvas.$imageDiv;
}

const TD = ThreeD.prototype;

TD.init = function () {
	const dimensions = this.getDimensions();

	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setClearColor( 0x222222 );
	this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( dimensions.width, dimensions.height );
	this.renderer.shadowMap.enabled = true;
	this.$container.html( this.renderer.domElement );

	this.manager = new THREE.LoadingManager();

	this.camera = new THREE.PerspectiveCamera( 60, dimensions.ratio, 0.001, 500000 );
	this.camera.up.set( 0, 0, 1 );
	const headlight = new THREE.PointLight( 0xffffff, 150 );
	this.camera.add( headlight );

	this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
	this.controls.rotateSpeed = 4;
	this.controls.zoomSpeed = 4;
	this.controls.panSpeed = 4;
	this.controls.addEventListener( 'change', this.render.bind( this ) );
	this.controls.addEventListener( 'start', this.controlsStart.bind( this ) );
	this.controls.addEventListener( 'end', this.controlsEnd.bind( this ) );

	this.scene = new THREE.Scene();
	this.scene.add( this.camera );

	this.scene.add( new THREE.AmbientLight( 0x666666, 2 ) );

	const light = new THREE.SpotLight( 0x999999, 100000 );
	light.position.set( -100, 50, 25 );
	light.castShadow = true;
	light.shadow.mapSize.width = 4096;
	light.shadow.mapSize.height = 4096;
	light.shadow.bias = -0.000025;
	this.camera.add( light );

	$( window ).on( 'resize.3d', mw.util.debounce( this.onWindowResize.bind( this ), 100 ) );

	this.render();
};

TD.center = function ( object ) {
	if ( object.type === 'Group' ) {
		this.center( object.children[ 0 ] );
	} else if ( object.type === 'Mesh' ) {
		object.geometry.center();
		object.geometry.computeBoundingSphere();

		const radius = object.geometry.boundingSphere.radius;

		// `radius` is the edge of the object's sphere
		// We want to position our camera outside of that sphere.
		// We'll move `radius` (or more) in all directions (x, y, z), so that we're
		// looking at the object somewhat diagonally, which should always show something
		// useful (instead of possibly an uninteresting side or top...)
		// The exact position of the camera was arbitrarily decided by what looked
		// alright-ish for a few files I was testing with.
		// sketchfab.com has this at ( 0, -distance, 0 )
		// viewstl.com has this at ( 0, 0 distance )
		// openjscad.org has this at ( 0, -distance, distance )
		// thingiverse.com has this at ( -distance, -distance, distance )
		this.camera.position.set( -radius * 1.5, -radius * 1.5, radius );
	}
};

TD.geometryToObject = function ( geometry ) {
	const vertexColors = geometry.hasAttribute( 'color' );
	const material = new THREE.MeshStandardMaterial(
		{ color: 0xf0ebe8, flatShading: true, side: THREE.DoubleSide, vertexColors }
	);

	return new THREE.Mesh( geometry, material );
};

TD.render = function () {
	this.renderer.render( this.scene, this.camera );
};

TD.animate = function () {
	requestAnimationFrame( this.animate.bind( this ) );
	this.controls.update();
};

TD.onWindowResize = function () {
	const dimensions = this.getDimensions();

	this.camera.aspect = dimensions.width / dimensions.height;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( dimensions.width, dimensions.height );

	this.controls.handleResize();

	this.render( this.renderer, this.scene, this.camera );
};

TD.unload = function () {
	// 3D files are wrapped inside a new parent class, where the '3D' badge
	// is also attached to
	// we don't want to keep that wrapper class around (could cause unexpected
	// results), and definitely want that '3D' badge gone...
	const $threedParent = this.$container.parent( '.mw-3d-wrapper' );
	$threedParent.replaceWith( this.$container );
};

TD.load = function ( extension, url ) {
	// Abort any loading that might still be happening
	if ( this.promise ) {
		this.promise.reject();
	}

	this.promise = this.loadFile( extension, url );

	this.progressBar.jumpTo( 0 );
	this.progressBar.animateTo( 5 );

	this.promise.then( ( object ) => {
		delete this.promise;

		this.progressBar.hide();

		object.castShadow = true;
		object.receiveShadow = true;

		this.center( object );
		this.scene.add( object );

		this.camera.lookAt( this.scene.position );
		this.render( this.renderer, this.scene, this.camera );

		mw.threed.base.wrap( this.$container );
	} ).progress( ( progress ) => {
		this.progressBar.animateTo( progress );
	} ).fail( ( /* error */ ) => {
		this.progressBar.hide();
		delete this.promise;
	} );
};

TD.loadFile = function ( extension, url ) {
	const deferred = $.Deferred();

	let loader;
	switch ( extension ) {
		case 'stl':
		default:
			loader = new THREE.STLLoader( this.manager );
			break;
	}

	const request = loader.load( url, ( data ) => {
		let object = data;

		if ( extension === 'stl' ) {
			object = this.geometryToObject( data );
		}

		deferred.resolve( object );
	}, ( progress ) => {
		deferred.notify( ( progress.loaded / progress.total ) * 100 );
	}, ( error ) => {
		deferred.reject( error );
	} );

	deferred.fail( () => {
		if ( request && request.readyState !== 4 ) {
			request.abort();
		}
	} );

	return deferred.promise();
};

TD.controlsStart = function () {
	$( this.renderer.domElement ).addClass( 'mw-mmv-canvas-mousedown' );
};

TD.controlsEnd = function () {
	$( this.renderer.domElement ).removeClass( 'mw-mmv-canvas-mousedown' );
};

TD.getDimensions = function () {
	const width = $( window ).width(),
		height = this.viewer.ui.canvas.$imageWrapper.height();

	return { width: width, height: height, ratio: width / height };
};

$( document ).on( 'mmv-metadata.3d', ( e ) => {
	const extension = e.image.filePageTitle.getExtension();

	// Ignore events from formats that we don't care about
	if ( extension !== 'stl' ) {
		return;
	}

	if ( !singleton ) {
		singleton = new ThreeD( e.viewer );
	}

	singleton.init();
	singleton.animate();
	singleton.load( extension, e.imageInfo.url );
} );

// unload when switching images or cleaning up MMV altogether
$( document ).on( 'mmv-hash mmv-cleanup-overlay', () => {
	if ( singleton ) {
		singleton.unload();
	}
} );

mw.mmv.ThreeD = ThreeD;
