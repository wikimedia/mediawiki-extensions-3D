<?php

namespace MediaWiki\Extensions\ThreeD;

/**
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 */

class ThreeDThumbnailImage extends \ThumbnailImage {
	/**
	 * @inheritDoc
	 */
	public function toHtml( $options = [] ) {
		return \Html::rawElement(
			'span',
			[
				'class' => 'mw-3d-wrapper',
				// Image is part of the content, so this message must be in the content language
				'data-label' => wfMessage( '3d-badge-text' )->inContentLanguage()->text()
			],
			parent::toHtml( $options )
		);
	}
}
