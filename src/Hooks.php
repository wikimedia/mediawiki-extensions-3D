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

namespace MediaWiki\Extension\ThreeD;

use ExtensionRegistry;
use MediaWiki\Config\Config;
use MediaWiki\Context\RequestContext;
use MediaWiki\Hook\UploadForm_getInitialPageTextHook;
use MediaWiki\Hook\UploadFormInitDescriptorHook;
use MediaWiki\MediaWikiServices;
use MediaWiki\Output\Hook\BeforePageDisplayHook;
use MediaWiki\Output\OutputPage;
use Skin;

// phpcs:disable MediaWiki.NamingConventions.LowerCamelFunctionsName.FunctionName

class Hooks implements
	BeforePageDisplayHook,
	UploadFormInitDescriptorHook,
	UploadForm_getInitialPageTextHook
{
	/**
	 * @param OutputPage $out
	 * @param Skin $skin
	 */
	public function onBeforePageDisplay( $out, $skin ): void {
		$title = $out->getTitle();
		if ( $title->getNamespace() === NS_FILE ) {
			$file = MediaWikiServices::getInstance()->getRepoGroup()->findFile( $title );
			if ( $file && $file->getMediaType() === MEDIATYPE_3D ) {
				// Load JS on file pages for placeholder functionality
				$out->addModules( [ 'ext.3d' ] );
				if ( ExtensionRegistry::getInstance()->isLoaded( 'MultimediaViewer' ) ) {
					$out->addModules( [ 'mmv.3d.head' ] );
				}
			}
		}
	}

	/**
	 * @param array &$descriptor
	 */
	public function onUploadFormInitDescriptor( &$descriptor ) {
		if ( !array_key_exists( 'License', $descriptor ) ) {
			return;
		}

		$patentMsg = PatentFormField::getMessageFromParams( [] );
		if ( $patentMsg === '' || $patentMsg === '-' ) {
			return;
		}

		// no JS should be added on UploadWizard, which only inherits from Special:Upload as
		// fallback when no JS is available...
		$context = RequestContext::getMain();
		$title = $context->getTitle();
		$addJs = $title && !$title->isSpecial( 'UploadWizard' );

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
			$config = $context->getConfig();
			$useAjaxPatentPreview = $config->get( 'AjaxPatentPreview' );

			// scripts & styles added separately to ensure CSS also loads without JS
			$out = $context->getOutput();
			$out->addModules( [ 'ext.3d.special.upload' ] );
			$out->addModuleStyles( [ 'ext.3d.special.upload.styles' ] );
			$out->addJsConfigVars( [ 'wgAjaxPatentPreview' => $useAjaxPatentPreview ] );
		}
	}

	/**
	 * @param string &$pageText
	 * @param array $msg
	 * @param Config $config
	 */
	public function onUploadForm_getInitialPageText( &$pageText, $msg, $config ) {
		global $wgRequest;
		$patent = $wgRequest->getText( 'wpPatent' );
		if ( $patent === '' ) {
			// no patent text to be added
			return;
		}

		$licenseHeader = '== ' . $msg['license-header'] . " ==\n";
		$patentText = '{{' . $patent . "}}\n";
		if ( strpos( $pageText, $licenseHeader ) >= 0 ) {
			// license header already exists; add it right there
			$pageText = str_replace( $licenseHeader, $licenseHeader . $patentText, $pageText );
		} else {
			// as the license header does not exist; create it & add patent info
			$pageText .= $licenseHeader . $patentText;
		}
	}
}
