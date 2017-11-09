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

	TD.createScene = function () {
		var threed = this,
			dimensions = this.dimensionsFunc(),
			ambient = new THREE.AmbientLight( 0x666666 ),
			dlight = new THREE.DirectionalLight( 0x999999 );

		dlight.position.set( 0, 0, 1 );
		dlight.castShadow = true;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 60, dimensions.ratio, 1, 5000 );
		this.manager = new THREE.LoadingManager();

		this.camera.up.set( 0, 0, 1 );
		this.camera.add( new THREE.PointLight( 0xffffff, 0.4 ) );

		this.scene.add( ambient );
		this.scene.add( dlight );
		this.scene.add( this.camera );

		this.renderer = new THREE.WebGLRenderer();

		this.renderer.setClearColor( 0x222222 );

		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		this.controls.addEventListener( 'change', $.proxy( function () { threed.render(); }, threed ) );
		this.controls.addEventListener( 'start', $.proxy( function () { threed.controlsStart(); }, threed ) );
		this.controls.addEventListener( 'end', $.proxy( function () { threed.controlsEnd(); }, threed ) );
		this.controls.enableKeys = false;
		this.controls.update();

		$( window ).on( 'resize.3d', $.debounce( 100, $.proxy( function () { threed.onWindowResize(); }, threed ) ) );

		this.animate();
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
		var material = new THREE.MeshPhongMaterial( { color: 0xF8F9FA, shading: THREE.FlatShading } );

		return new THREE.Mesh( geometry, material );
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

			object.castShadow = true;

			threed.center( object );
			threed.scene.add( object );

			deferred.resolve();
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

		return deferred;
	};

	TD.render = function () {
		this.renderer.render( this.scene, this.camera );
	};

	TD.animate = function () {
		if ( this.renderer && this.scene && this.camera ) {
			this.render( this.renderer, this.scene, this.camera );
		}

		requestAnimationFrame( $.proxy( function () { this.animate(); }, this ) );
	};

	TD.onWindowResize = function () {
		var dimensions = this.dimensionsFunc();

		if ( !this.camera || !this.renderer || !this.scene ) {
			return;
		}

		this.camera.aspect = dimensions.width / dimensions.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( dimensions.width, dimensions.height );
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

		this.promise.then( function () {
			var dimensions = threed.dimensionsFunc();
			delete threed.promise;

			threed.progressBar.hide();
			threed.renderer.setSize( dimensions.width, dimensions.height );
			threed.$container.html( threed.renderer.domElement );
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

	TD.controlsStart = function () {
		$( this.renderer.domElement ).addClass( 'mousedown' );
	};

	TD.controlsEnd = function () {
		$( this.renderer.domElement ).removeClass( 'mousedown' );
	};

	TD.dimensionsFunc = function () {
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

		// Clear any state, create objects for render.
		singleton.createScene();

		// Complete load.
		singleton.load( extension, e.imageInfo.url );
	} );

	mw.mmv.ThreeD = ThreeD;
}( mediaWiki, jQuery ) );
