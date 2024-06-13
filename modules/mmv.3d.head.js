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

mw.threed.mmv = {
	mmvBootstrap: null,

	/**
	 * @param {jQuery} $images
	 */
	attachControls: function ( $images ) {
		$images.each( ( i, image ) => {
			const $image = $( image ),
				$link = $image.closest( 'a' );

			mw.threed.base.thumbnailLoadComplete( $image[ 0 ] )
				.then( () => {
					const $wrap = mw.threed.base.wrap( $image ),
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

					view.on( 'click', this.open.bind( this, $image ) );
					download.on( 'click', this.download.bind( this, $link ) );

					$wrap.append( $buttonWrap );
				} );

			// Clicking the file should open it in MMV instead of prompting download
			$link.on( 'click', ( e ) => {
				e.preventDefault();
				this.open( $image );
			} );
		} );
	},

	/**
	 * @param {jQuery} $image
	 */
	open: function ( $image ) {
		mw.loader.using( [ 'mmv.bootstrap' ] ).then( ( req ) => {
			if ( this.mmvBootstrap === null ) {
				const MultimediaViewerBootstrap = req( 'mmv.bootstrap' ).MultimediaViewerBootstrap;
				this.mmvBootstrap = new MultimediaViewerBootstrap();
				this.mmvBootstrap.setupEventHandlers();
			}

			const title = mw.Title.newFromImg( $image );
			this.mmvBootstrap.openImage( title );
		} );
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
