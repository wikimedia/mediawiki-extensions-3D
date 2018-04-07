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

use HTMLRadioField;
use Licenses;

class PatentFormField extends Licenses {
	/**
	 * @inheritDoc
	 */
	protected static function getMessageFromParams( $params ) {
		global $wgLanguageCode;

		if ( !empty( $params['patents'] ) ) {
			return $params['patents'];
		}

		// The 3d-patents page is in $wgForceUIMsgAsContentMsg (its translations will
		// be in subpages). If such translation can't be found, fall back to default.
		$defaultMsg = wfMessage( '3d-patents' )->inContentLanguage();
		if ( !$defaultMsg->exists() || $defaultMsg->plain() === '-' ) {
			$defaultMsg = wfMessage( '3d-patents' )->inLanguage( $wgLanguageCode );
		}

		return $defaultMsg->plain();
	}

	/**
	 * @param string $line
	 * @return PatentLine
	 */
	protected function buildLine( $line ) {
		return new PatentLine( $line );
	}

	/**
	 * @inheritDoc
	 */
	public function getInputHTML( $value ) {
		$options = [];
		$options[$this->msg( '3d-nopatent' )->text()] = '';
		$options += $this->getOptionsArray();

		$field = new HTMLRadioField( [
			'fieldname' => 'Patent',
			'id' => 'wpPatent',
			'options' => $options,
		] );
		return $field->getInputHTML( $value );
	}

	/**
	 * @return array
	 */
	protected function getOptionsArray() {
		$lines = $this->getLines();
		$options = [];
		foreach ( $lines as $line ) {
			$msgObj = $this->msg( $line->text );
			$text = $msgObj->exists() ? $msgObj->text() : $line->text;

			$options[$text] = $line->template;
		}
		return $options;
	}
}
