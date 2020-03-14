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

use MediaWiki\MediaWikiServices;

class Hooks {
	/**
	 * @param \OutputPage &$out
	 * @param \Skin &$skin
	 * @return bool
	 */
	public static function onBeforePageDisplay( \OutputPage &$out, \Skin &$skin ) {
		$title = $out->getTitle();
		if ( $title->getNamespace() === NS_FILE ) {
			$file = MediaWikiServices::getInstance()->getRepoGroup()->findFile( $title );
			if ( $file && $file->getMediaType() === MEDIATYPE_3D ) {
				// Load JS on file pages for placeholder functionality
				$out->addModules( [ 'ext.3d' ] );
				if ( \ExtensionRegistry::getInstance()->isLoaded( 'MultimediaViewer' ) ) {
					$out->addModules( [ 'mmv.3d.head' ] );
				}
			}
		}

		return true;
	}

	/**
	 * @param \DummyLinker &$dummy
	 * @param \Title &$title
	 * @param \File|bool &$file
	 * @param array &$frameParams
	 * @param array &$handlerParams
	 * @param string|bool &$time
	 * @param string|null &$result
	 * @param \Parser $parser
	 * @param string &$query
	 * @param int|null &$widthOption
	 */
	public static function onImageBeforeProduceHTML(
		&$dummy, \Title &$title, &$file, array &$frameParams,
		array &$handlerParams, &$time, &$result, \Parser $parser, string &$query, &$widthOption
	) {
		if ( $file && $file->getMediaType() === MEDIATYPE_3D ) {
			$parser->getOutput()->addModuleStyles( [ 'ext.3d.styles' ] );
		}
	}

	/**
	 * @param array &$descriptor
	 * @return bool
	 */
	public static function onUploadFormInitDescriptor( array &$descriptor ) {
		global $wgOut;

		if ( !array_key_exists( 'License', $descriptor ) ) {
			return true;
		}

		$patentField = new PatentFormField( [ 'fieldname' => 'Patent' ] );
		if ( empty( $patentField->getLines() ) ) {
			return true;
		}

		// no JS should be added on UploadWizard, which only inherits from Special:Upload as
		// fallback when no JS is available...
		$title = $wgOut->getTitle();
		$titleUW = \SpecialPage::getTitleFor( 'UploadWizard' );
		$addJs = $title && !$title->equals( $titleUW ) && !$title->isSubpageOf( $titleUW );

		$patentDescriptor = [
			'Patent' => [
				'type' => 'select',
				'class' => PatentFormField::class,
				'cssclass' => 'mw-htmlform-field-3D-Patents',
				'section' => 'description',
				'id' => 'wpPatent',
				'label-message' => '3d-patent',
			]
		];

		// $descriptor is an associative array, but the order of the items matters for where in
		// the form they will appear; we want it right before 'License'
		$position = array_search( 'License', array_keys( $descriptor ), true );
		$descriptor = array_slice( $descriptor, 0, $position, true ) +
			$patentDescriptor +
			array_slice( $descriptor, $position, null, true );

		if ( $addJs ) {
			$context = \RequestContext::getMain();
			$config = $context->getConfig();
			$useAjaxPatentPreview = $config->get( 'UseAjax' ) &&
				$config->get( 'AjaxPatentPreview' );

			// scripts & styles added separately to ensure CSS also loads without JS
			$wgOut->addModules( [ 'ext.3d.special.upload' ] );
			$wgOut->addModuleStyles( [ 'ext.3d.special.upload.styles' ] );
			$wgOut->addJsConfigVars( [ 'wgAjaxPatentPreview' => $useAjaxPatentPreview ] );
		}

		return true;
	}

	/**
	 * @param string &$pageText
	 * @param array $msg
	 * @param \Config $config
	 * @return bool
	 */
	public static function onGetInitialPageText( &$pageText, array $msg, \Config $config ) {
		global $wgRequest;
		$patent = $wgRequest->getText( 'wpPatent' );
		if ( $patent === '' ) {
			// no patent text to be added
			return true;
		}

		$licenseHeader = '== ' . $msg['license-header'] . " ==\n";
		$patentText = '{{' . $patent . "}}\n";
		if ( strpos( $pageText, $licenseHeader ) >= 0 ) {
			// license header already exists; add it right there
			$pageText = str_replace( $licenseHeader, $licenseHeader . $patentText, $pageText );
		} else {
			// license header does not already exist; create it & add patent info
			$pageText .= $licenseHeader . $patentText;
		}

		return true;
	}
}
