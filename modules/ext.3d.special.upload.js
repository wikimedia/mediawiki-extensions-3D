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

	mw.threed = mw.threed || {};

	mw.threed.specialUpload = {
		// eslint-disable-next-line no-jquery/no-global-selector
		$patent: $( 'input[name=wpPatent]' ),
		$patentPreview: $( '<td>' ).attr( 'id', 'mw-patent-preview' ),
		uploadTemplatePreview: window.wgUploadTemplatePreviewObj,

		addPatentPreview: function () {
			// Patent selector table row
			this.$patent.closest( 'tr' ).after(
				$( '<tr>' ).append(
					$( '<td>' ),
					this.$patentPreview
				)
			);

			// Patent selector check
			this.$patent.on( 'change', function ( e ) {
				// We might show a preview
				this.uploadTemplatePreview.getPreview( $( e.currentTarget ), this.$patentPreview );
			}.bind( this ) );
		},

		/**
		 * @param {boolean} show True to show, false to hide
		 */
		togglePatentSelector: function ( show ) {
			// select default value & show/hide the options
			this.$patent.eq( 0 ).prop( 'checked', true );
			this.$patent.closest( 'tr.mw-htmlform-field-3D-Patents' ).toggle( show );
			this.$patentPreview.closest( 'tr' ).toggle( show );
		},

		onChangeFile: function () {
			// eslint-disable-next-line no-jquery/no-global-selector
			var files = $( '#wpUploadFile' )[ 0 ].files,
				stlFiles = [];

			if ( !files ) {
				return;
			}

			Array.prototype.filter.call( files, function ( file ) {
				return file.name.split( '.' ).pop().toLowerCase() === 'stl';
			} );

			// only show patent selector when the upload is an STL file
			this.togglePatentSelector( stlFiles.length > 0 );
		},

		init: function () {
			if ( mw.config.get( 'wgAjaxPatentPreview' ) && this.$patent.length ) {
				this.addPatentPreview();
			}

			// hide patent selection until a relevant file has been uploaded
			this.togglePatentSelector( false );

			// eslint-disable-next-line no-jquery/no-global-selector
			$( '#wpUploadFile' ).on( 'change', this.onChangeFile.bind( this ) );
		}
	};

	mw.threed.specialUpload.init();
}() );
