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
	'use strict';

	var $thumbs = $( 'img[src$=".stl.png"]' );

	mw.threed = mw.threed || {};

	mw.threed.base = {
		/**
		 * @type {object}
		 */
		thumbnailPromises: {},

		/**
		 * @type {jQuery}
		 */
		$placeholderTemplate: $( '<span>' )
			.addClass( 'mw-3d-thumb-placeholder' )
			.text( ' ' + mw.message( '3d-thumb-placeholder' ).text() )
			.prepend( $.createSpinner( { size: 'small', type: 'inline' } ) ),

		/**
		 * @param {jQuery} $elements
		 * @return {jQuery}
		 */
		wrap: function ( $elements ) {
			$elements.each( function ( i, element ) {
				if ( !$( element ).parent().hasClass( 'mw-3d-wrapper' ) ) {
					$( element ).wrap( $( '<span>' ).addClass( 'mw-3d-wrapper' ) );
				}
			} );

			return $elements.parent();
		},

		/**
		 * @param {jQuery} $elements
		 */
		attachBadge: function ( $elements ) {
			$elements.each( function ( i, element ) {
				this.thumbnailLoadComplete( element )
					.then( function ( element ) {
						var $wrap = this.wrap( $( element ) ),
							$badge = $( '<span>' )
								.addClass( 'mw-3d-badge' )
								.text( mw.message( '3d-badge-text' ).text() );

						$wrap.append( $badge );
					}.bind( this ) );
			}.bind( this ) );
		},

		/**
		 * @param {jQuery} $elements
		 */
		addThumbnailPlaceholder: function ( $elements ) {
			var self = this;

			$elements.each( function () {
				var $image = $( this ),
					$wrap = self.wrap( $image ),
					loadingComplete = false,
					$placeholder = self.$placeholderTemplate.clone()
						.css( 'min-height', parseInt( $image.attr( 'height' ) || 0 ) );

				/*
				 * Wait 50ms before hiding the image: if it is already present, we won't
				 * know about it until the below `thumbnailLoadComplete` promise resolves
				 * and there'd be a small FOUC between hiding & showing the image again.
				 * This small delay ensures that is the image is already present, it won't
				 * flash off/on, while still replacing a slowly loading image fast enough
				 * with a placeholder to inform the user it's processing.
				 */
				setTimeout( function () {
					if ( !loadingComplete ) {
						$image.hide();
						$wrap.append( $placeholder );
					}
				}, 50 );

				self.thumbnailLoadComplete( $image[ 0 ] )
					.then( function () {
						loadingComplete = true;
						$placeholder.remove();
						$image.show();
					} );
			} );
		},

		/**
		 * @param {string} src
		 * @return {$.Promise}
		 */
		loadSrc: function ( src ) {
			var deferred = new $.Deferred(),
				img = new Image();

			img.onload = deferred.resolve;
			img.onerror = deferred.reject;

			img.src = src;

			return deferred.promise();
		},

		/**
		 * Figure out when the thumbnail has completed loading.
		 *
		 * @param {HTMLImageElement} img
		 * @return {$.Promise} Promise that resolves with the thumbnail HTMLImageElement
		 */
		thumbnailLoadComplete: function ( img ) {
			var deferred = $.Deferred(),
				src = img.src,
				reload = function () {
					this.loadSrc( src ).then(
						function () {
							// in case this img timed out earlier, reset it so the browser
							// will load it anew...
							img.src = src;

							// I could nest this.imageLoadComplete's returned promises, but
							// if it takes forever to load the image, we'd keep filling up
							// the call stack to the point that it could crash. Instead, I'll
							// create a new deferred object that'll resolve once we've found
							// the thumbnail loading to be complete.
							deferred.resolve( img );
						},
						// wait 5 seconds before attempting to load the image again
						setTimeout.bind( null, reload, 5000 )
					);
				}.bind( this );

			// safeguard to prevent the thumbnail node cloning below from being executed
			// more than once...
			if ( src in this.thumbnailPromises ) {
				return this.thumbnailPromises[ src ];
			}
			this.thumbnailPromises[ src ] = deferred.promise();

			reload();

			return this.thumbnailPromises[ src ];
		}
	};

	mw.threed.base.attachBadge( $thumbs );
	mw.threed.base.addThumbnailPlaceholder( $thumbs );
}( mediaWiki, jQuery ) );
