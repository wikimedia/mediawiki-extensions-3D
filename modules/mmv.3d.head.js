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

( function () {
	'use strict';

	mw.threed.mmv = {
		mmvBootstrap: null,

		/**
		 * @param {jQuery} $images
		 */
		attachControls: function ( $images ) {
			var self = this;
			$images.each( function () {
				var $image = $( this ),
					$link = $image.closest( 'a' );

				mw.threed.base.thumbnailLoadComplete( $image[ 0 ] )
					.then( function () {
						var $wrap = mw.threed.base.wrap( $image ),
							view = new OO.ui.ButtonWidget( {
								icon: 'eye',
								flags: [ 'progressive' ],
								title: mw.message( 'view' ).text()
							} ),
							download = new OO.ui.ButtonWidget( {
								icon: 'download',
								flags: [ 'progressive' ],
								title: mw.message( 'download' ).text()
							} ),
							$buttonWrap = $( '<span>' )
								.addClass( 'mw-3d-control-wrapper' )
								.append( view.$element, download.$element );

						view.on( 'click', self.open.bind( self, $image ) );
						download.on( 'click', self.download.bind( self, $link ) );

						$wrap.append( $buttonWrap );
					} );

				// Clicking the file should open it in MMV instead of prompting download
				$link.on( 'click', function ( e ) {
					e.preventDefault();
					self.open( $image );
				} );
			} );
		},

		/**
		 * @param {jQuery} $image
		 */
		open: function ( $image ) {
			mw.loader.using( [ 'mmv.bootstrap' ] ).then( function ( req ) {
				if ( this.mmvBootstrap === null ) {
					var MultimediaViewerBootstrap = req( 'mmv.bootstrap' ).MultimediaViewerBootstrap;
					this.mmvBootstrap = new MultimediaViewerBootstrap();
					this.mmvBootstrap.setupEventHandlers();
				}

				var title = mw.Title.newFromImg( $image );
				this.mmvBootstrap.openImage( title );
			}.bind( this ) );
		},

		/**
		 * @param {jQuery} $link
		 */
		download: function ( $link ) {
			window.location = $link.attr( 'href' );
		}
	};

	// eslint-disable-next-line no-jquery/no-global-selector
	mw.threed.mmv.attachControls( $( '.fullImageLink .mw-3d-wrapper img' ) );
}() );
