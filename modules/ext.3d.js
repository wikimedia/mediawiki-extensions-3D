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

	mw.threed = mw.threed || {};

	mw.threed.base = {
		wrap: function ( $element ) {
			if ( !$element.parent().hasClass( 'mw-3d-wrapper' ) ) {
				$element.wrap( $( '<span>' ).addClass( 'mw-3d-wrapper' ) );
			}

			return $element.parent();
		},

		/**
		 * @param {jQuery} $element
		 */
		attachBadge: function ( $element ) {
			var $wrap = this.wrap( $element ),
				$badge = $( '<span>' )
					.addClass( 'mw-3d-badge' )
					.text( mw.message( '3d-badge-text' ).text() );

			$wrap.append( $badge );
		}
	};

	mw.threed.base.attachBadge( $( 'img[src$=".stl.png"]' ) );
}( mediaWiki, jQuery ) );
