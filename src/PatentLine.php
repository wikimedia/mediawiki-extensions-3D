<?php
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

namespace MediaWiki\Extensions\ThreeD;

use License;
use RawMessage;

class PatentLine extends License {
	/**
	 * @inheritDoc
	 */
	protected function parse( $str ) {
		// the split method is quite crude, so we'll first attempt to parse the text
		// as a message, so some acceptable wikitext (e.g. [[link|]]) won't confuse
		// our splitting
		$msg = new RawMessage( $str );
		return $msg->parse();
	}
}
