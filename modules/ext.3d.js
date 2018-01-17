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
			var $wrap = this.wrap( $elements ),
				$badge = $( '<span>' )
					.addClass( 'mw-3d-badge' )
					.text( mw.message( '3d-badge-text' ).text() );

			$elements.each( function ( i, element ) {
				this.thumbnailLoadComplete( element ).then( function () { $wrap.append( $badge ); } );
			}.bind( this ) );
		},

		/**
		 * @param {jQuery} $elements
		 */
		addThumbnailPlaceholder: function ( $elements ) {
			var $spinner = $.createSpinner( { size: 'small', type: 'inline' } ),
				$placeholder = $( '<p>' )
					.addClass( 'mw-3d-thumb-placeholder' )
					.text( ' ' + mw.message( '3d-thumb-placeholder' ).text() + ' ' )
					.prepend( $spinner );

			// hide the image and put a placeholder there instead
			$elements.hide().after( $placeholder );

			$elements.each( function ( i, element ) {
				this.thumbnailLoadComplete( element )
					.then( function ( element ) {
						// image confirmed to have loaded: show it & remove placeholder
						$( element ).siblings( '.mw-3d-thumb-placeholder' ).remove();
						$( element ).show();
					} );
			}.bind( this ) );
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
				reload = function () { img.src = src; };

			// safeguard to prevent the thumbnail node cloning below from being executed
			// more than once...
			if ( src in this.thumbnailPromises ) {
				return this.thumbnailPromises[ src ];
			}
			this.thumbnailPromises[ src ] = deferred.promise();

			// resolve the promise as soon as this image has loaded
			img.onload = deferred.resolve.bind( deferred, img );

			// if we fail to load the image (e.g. timeout), wait 5 seconds
			// and try again by writing to .src
			img.onerror = setTimeout.bind( null, reload, 5000 );

			reload();

			return this.thumbnailPromises[ src ];
		}
	};

	mw.threed.base.attachBadge( $thumbs );
	mw.threed.base.addThumbnailPlaceholder( $thumbs );
}( mediaWiki, jQuery ) );
