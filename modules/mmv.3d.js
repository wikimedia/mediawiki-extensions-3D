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

( function ( mw, $ ) {
	var singleton = false;

	function ThreeD( viewer ) {
		THREE.Cache.enabled = true;

		this.viewer = viewer;
		this.progressBar = viewer.ui.panel.progressBar;
		this.$container = viewer.ui.canvas.$imageDiv;
	}

	TD = ThreeD.prototype;

	TD.init = function () {
		var dimensions = this.getDimensions(),
			light;

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor( 0x222222 );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( dimensions.width, dimensions.height );
		this.renderer.shadowMap.enabled = true;
		this.$container.html( this.renderer.domElement );

		this.manager = new THREE.LoadingManager();

		this.camera = new THREE.PerspectiveCamera( 60, dimensions.ratio, 1, 500000 );
		this.camera.up.set( 0, 0, 1 );
		this.camera.add( new THREE.PointLight( 0xffffff, 0.3 ) );

		this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
		this.controls.rotateSpeed = 4;
		this.controls.zoomSpeed = 4;
		this.controls.panSpeed = 4;
		this.controls.addEventListener( 'change', this.render.bind( this ) );
		this.controls.addEventListener( 'start', this.controlsStart.bind( this ) );
		this.controls.addEventListener( 'end', this.controlsEnd.bind( this ) );

		this.scene = new THREE.Scene();
		this.scene.add( this.camera );

		this.scene.add( new THREE.AmbientLight( 0x666666, 0.5 ) );

		light = new THREE.SpotLight( 0x999999, 1 );
		light.position.set( -100, 50, 25 );
		light.castShadow = true;
		light.shadow.mapSize.width = 4096;
		light.shadow.mapSize.height = 4096;
		this.camera.add( light );

		$( window ).on( 'resize.3d', $.debounce( 100, this.onWindowResize.bind( this ) ) );

		this.render();
	};

	TD.center = function ( object ) {
		var radius;

		if ( object.type === 'Group' ) {
			this.center( object.children[ 0 ] );
		} else if ( object.type === 'Mesh' ) {
			object.geometry.center();
			object.geometry.computeBoundingSphere();

			radius = object.geometry.boundingSphere.radius;

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
			this.camera.position.set( radius * 1.5, -radius * 1.5, radius );
		}
	};

	TD.geometryToObject = function ( geometry ) {
		var material = new THREE.MeshPhongMaterial( { color: 0xc3bdae, shininess: 10, flatShading: true } );
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
		var dimensions = this.getDimensions();

		this.camera.aspect = dimensions.width / dimensions.height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( dimensions.width, dimensions.height );

		this.controls.handleResize();

		this.render( this.renderer, this.scene, this.camera );
	};

	TD.load = function ( extension, url ) {
		var threed = this;

		// Abort any loading that might still be happening
		if ( this.promise ) {
			this.promise.reject();
		}

		this.promise = this.loadFile( extension, url );

		this.progressBar.jumpTo( 0 );
		this.progressBar.animateTo( 5 );

		this.promise.then( function ( object ) {
			delete threed.promise;

			threed.progressBar.hide();

			object.castShadow = true;
			object.receiveShadow = true;

			threed.center( object );
			threed.scene.add( object );

			threed.camera.lookAt( threed.scene.position );
			threed.render( threed.renderer, threed.scene, threed.camera );

			mw.threed.attachBadge( threed.$container );
		} ).progress( function ( progress ) {
			threed.progressBar.animateTo( progress );
		} ).fail( function ( /* error */ ) {
			threed.progressBar.hide();
			delete threed.promise;
		} );
	};

	TD.loadFile = function ( extension, url ) {
		var threed = this,
			deferred = $.Deferred(),
			request,
			loader;

		if ( extension === 'stl' ) {
			loader = new THREE.STLLoader( this.manager );
		}

		request = loader.load( url, function ( data ) {
			var object = data;

			if ( extension === 'stl' ) {
				object = threed.geometryToObject( data );
			}

			deferred.resolve( object );
		}, function ( progress ) {
			deferred.notify( ( progress.loaded / progress.total ) * 100 );
		}, function ( error ) {
			deferred.reject( error );
		} );

		deferred.fail( function () {
			if ( request && request.readyState !== 4 ) {
				request.abort();
			}
		} );

		return deferred.promise();
	};

	TD.controlsStart = function () {
		$( this.renderer.domElement ).addClass( 'mousedown' );
	};

	TD.controlsEnd = function () {
		$( this.renderer.domElement ).removeClass( 'mousedown' );
	};

	TD.getDimensions = function () {
		var width = $( window ).width(),
			height = this.viewer.ui.canvas.$imageWrapper.height();

		return { width: width, height: height, ratio: width / height };
	};

	$( document ).on( 'mmv-metadata.3d', function ( e ) {
		var extension = e.image.filePageTitle.ext;

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

	mw.mmv.ThreeD = ThreeD;
}( mediaWiki, jQuery ) );
