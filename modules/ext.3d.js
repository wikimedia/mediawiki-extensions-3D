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

mw.threed = mw.threed || {};

mw.threed.base = {
	/**
	 * @type {Object}
	 */
	thumbnailPromises: {},

	/**
	 * @return {jQuery}
	 */
	createPlaceholderTemplate: function () {
		if ( !this.$placeholderTemplate ) {
			this.$placeholderTemplate = $( '<span>' )
				.addClass( 'mw-3d-thumb-placeholder' )
				.text( ' ' + mw.message( '3d-thumb-placeholder' ).text() )
				.prepend( $.createSpinner( { size: 'small', type: 'inline' } ) );
		}
		return this.$placeholderTemplate.clone();
	},

	/**
	 * @param {jQuery} $thumbs
	 * @return {jQuery}
	 */
	wrap: function ( $thumbs ) {
		$thumbs.each( ( i, image ) => {
			if ( !$( image ).closest( '.mw-3d-wrapper' ).length ) {
				$( image ).wrap( $( '<span>' ).addClass( 'mw-3d-wrapper' ).attr( 'data-label', mw.message( '3d-badge-text' ) ) );
			}
		} );

		return $thumbs.parent();
	},

	/**
	 * @param {jQuery} $content
	 */
	onWikipageContent: function ( $content ) {
		this.init( $content.find( '.mw-3d-wrapper img' ) );
	},

	/**
	 * @param {jQuery} $thumbs
	 */
	init: function ( $thumbs ) {
		mw.threed.base.addThumbnailPlaceholder( $thumbs );
	},

	/**
	 * @param {jQuery} $thumbs
	 */
	addThumbnailPlaceholder: function ( $thumbs ) {
		$thumbs.each( ( i, image ) => {
			const $image = $( image ),
				$wrap = this.wrap( $image ),
				$placeholder = this.createPlaceholderTemplate()
					.css( 'min-height', +$image.attr( 'height' ) || 0 );

			let loadingComplete = false;
			/*
			 * Wait 50ms before hiding the image: if it is already present, we won't
			 * know about it until the below `thumbnailLoadComplete` promise resolves
			 * and there'd be a small FOUC between hiding & showing the image again.
			 * This small delay ensures that is the image is already present, it won't
			 * flash off/on, while still replacing a slowly loading image fast enough
			 * with a placeholder to inform the user it's processing.
			 */
			setTimeout( () => {
				if ( !loadingComplete ) {
					$image.hide();
					$wrap.append( $placeholder );
				}
			}, 50 );

			this.thumbnailLoadComplete( $image[ 0 ] )
				.then( () => {
					loadingComplete = true;
					$placeholder.remove();
					$image.show();
				} );
		} );
	},

	/**
	 * @param {string} src
	 * @return {jQuery.Promise}
	 */
	loadSrc: function ( src ) {
		const deferred = $.Deferred(),
			img = document.createElement( 'img' );

		img.onload = deferred.resolve;
		img.onerror = deferred.reject;

		img.src = src;

		return deferred.promise();
	},

	/**
	 * Figure out when the thumbnail has completed loading.
	 *
	 * @param {HTMLImageElement} img
	 * @return {jQuery.Promise} Promise that resolves when the thumbnail has completed loading
	 */
	thumbnailLoadComplete: function ( img ) {
		const src = img.src;

		// Check promise cache to avoid duplicate requests
		if ( !this.thumbnailPromises[ src ] ) {
			const deferred = $.Deferred();
			this.thumbnailPromises[ src ] = deferred.promise();

			const reload = () => {
				this.loadSrc( src ).then(
					() => {
						// in case this img timed out earlier, reset it so the browser
						// will load it anew...
						img.src = src;

						// I could nest this.imageLoadComplete's returned promises, but
						// if it takes forever to load the image, we'd keep filling up
						// the call stack to the point that it could crash. Instead, I'll
						// create a new deferred object that'll resolve once we've found
						// the thumbnail loading to be complete.
						deferred.resolve();
					},
					// wait 5 seconds before attempting to load the image again
					setTimeout( reload, 5000 )
				);
			};
			reload();
		}

		return this.thumbnailPromises[ src ];
	}
};

mw.hook( 'wikipage.content' ).add( mw.threed.base.onWikipageContent.bind( mw.threed.base ) );
