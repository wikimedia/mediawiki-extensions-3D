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

class ThreeDHandler extends \ImageHandler {
	/**
	 * @param $file
	 * @return bool
	 */
	public function mustRender( $file ) {
		return true;
	}

	public function isVectorized( $file ) {
		return true;
	}

	/**
	 * @param \File $image
	 * @param array $params
	 * @return bool
	 */
	public function normaliseParams( $image, &$params ) {
		global $wgSVGMaxSize;
		if ( !parent::normaliseParams( $image, $params ) ) {
			return false;
		}

		// Don't make an image bigger than wgMaxSVGSize on the smaller side
		if ( $params['physicalWidth'] <= $params['physicalHeight'] ) {
			if ( $params['physicalWidth'] > $wgSVGMaxSize ) {
				$srcWidth = $image->getWidth();
				$srcHeight = $image->getHeight();
				$params['physicalWidth'] = $wgSVGMaxSize;
				$params['physicalHeight'] = \File::scaleHeight( $srcWidth, $srcHeight, $wgSVGMaxSize );
			}
		} else {
			if ( $params['physicalHeight'] > $wgSVGMaxSize ) {
				$srcWidth = $image->getWidth();
				$srcHeight = $image->getHeight();
				$params['physicalWidth'] = \File::scaleHeight( $srcHeight, $srcWidth, $wgSVGMaxSize );
				$params['physicalHeight'] = $wgSVGMaxSize;
			}
		}

		return true;
	}

	/**
	 * @param \File $image
	 * @param string $dstPath
	 * @param string $dstUrl
	 * @param array $params
	 * @param int $flags
	 * @return \MediaTransformError|\MediaTransformOutput|\ThumbnailImage|\TransformParameterError
	 */
	public function doTransform( $image, $dstPath, $dstUrl, $params, $flags = 0 ) {
		// @codingStandardsIgnoreStart
		global $wg3dProcessor, $wg3dProcessEnviron, $wgMax3d2pngMemory;
		// @codingStandardsIgnoreEnd

		// Impose an aspect ratio
		$params['height'] = round( $params['width'] / ( 640 / 480 ) );

		if ( $flags & self::TRANSFORM_LATER ) {
			return new \ThumbnailImage( $image, $dstUrl, $dstPath, $params );
		}

		$width = $params['width'];
		$height = $params['height'];

		if ( !wfMkdirParents( dirname( $dstPath ), null, __METHOD__ ) ) {
			return $this->doThumbError( $width, $height, 'thumbnail_dest_directory' );
		}

		$srcPath = $image->getLocalRefPath();

		// $wg3dProcessor can be string (e.g. '/path/to/3d2png.js') or array
		// (e.g. ['xvfb-run', '-a', '-s', '-ac -screen 0 1280x1024x24', '/path/to/3d2png.js'])
		$cmd = wfEscapeShellArg( array_merge( (array)$wg3dProcessor, [
			$srcPath,
			sprintf( '%dx%d', $width, $height ),
			$dstPath
		] ) );

		wfProfileIn( 'ThreeDHandler' );
		wfDebug( __METHOD__ . ": $cmd\n" );
		$retval = '';
		$err = wfShellExecWithStderr(
			$cmd, $retval, $wg3dProcessEnviron, [ 'memory' => $wgMax3d2pngMemory ]
		);
		wfProfileOut( 'ThreeDHandler' );

		if ( $retval != 0 ) {
			wfDebugLog( 'thumbnail',
				sprintf( 'thumbnail failed on %s: error %d "%s" from "%s"',
				wfHostname(), $retval, trim( $err ), $cmd ) );
			return new \MediaTransformError( 'thumbnail_error', $width, $height, $err );
		} else {
			return new \ThumbnailImage( $image, $dstUrl, $width, $height, $dstPath );
		}
	}

	/**
	 * @param \File $file
	 * @param string $path Unused
	 * @param bool|array $metadata
	 * @return array
	 */
	public function getImageSize( $file, $path, $metadata = false ) {
		return [ 5120, 2880 ];
	}

	public function getThumbType( $ext, $mime, $params = null ) {
		return [ 'png', 'image/png' ];
	}
}
