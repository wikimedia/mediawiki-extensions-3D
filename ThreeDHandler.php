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

class ThreeDHandler extends ImageHandler {
	/**
	 * @param $file
	 * @return bool
	 */
	function mustRender( $file ) {
		return true;
	}

	function isVectorized( $file ) {
		return true;
	}

	/**
	 * @param File $image
	 * @param array $params
	 * @return bool
	 */
	function normaliseParams( $image, &$params ) {
		global $wgSVGMaxSize;
		if ( !parent::normaliseParams( $image, $params ) ) {
			return false;
		}

		# Don't make an image bigger than wgMaxSVGSize on the smaller side
		if ( $params['physicalWidth'] <= $params['physicalHeight'] ) {
			if ( $params['physicalWidth'] > $wgSVGMaxSize ) {
				$srcWidth = $image->getWidth();
				$srcHeight = $image->getHeight();
				$params['physicalWidth'] = $wgSVGMaxSize;
				$params['physicalHeight'] = File::scaleHeight( $srcWidth, $srcHeight, $wgSVGMaxSize );
			}
		} else {
			if ( $params['physicalHeight'] > $wgSVGMaxSize ) {
				$srcWidth = $image->getWidth();
				$srcHeight = $image->getHeight();
				$params['physicalWidth'] = File::scaleHeight( $srcHeight, $srcWidth, $wgSVGMaxSize );
				$params['physicalHeight'] = $wgSVGMaxSize;
			}
		}

		return true;
	}

	/**
	 * @param $image File
	 * @param $dstPath string
	 * @param $dstUrl string
	 * @param $params array
	 * @param $flags int
	 * @return MediaTransformError|MediaTransformOutput|ThumbnailImage|TransformParameterError
	 */
	function doTransform( $image, $dstPath, $dstUrl, $params, $flags = 0 ) {
		global $wg3dProcessor, $wg3dProcessEnviron;

		// Impose an aspect ratio
		$params['height'] = round( $params['width'] / ( 640 / 480 ) );

		if ( $flags & self::TRANSFORM_LATER ) {
			return new ThumbnailImage( $image, $dstUrl, $dstPath, $params );
		}

		if ( !wfMkdirParents( dirname( $dstPath ), null, __METHOD__ ) ) {
			return $this->doThumbError( $width, $height, 'thumbnail_dest_directory' );
		}

		$width = $params['width'];
		$height = $params['height'];

		$srcPath = $image->getLocalRefPath();

		$cmd = wfEscapeShellArg(
			$wg3dProcessor,
			$srcPath,
			sprintf( '%dx%d', $width, $height ),
			$dstPath
		);

		wfProfileIn( 'ThreeDHandler' );
		wfDebug( __METHOD__ . ": $cmd\n" );
		$retval = '';
		$err = wfShellExecWithStderr( $cmd, $retval, $wg3dProcessEnviron, [ 'memory' => '10000000' ] );
		wfProfileOut( 'ThreeDHandler' );

		if ( $retval != 0 || $removed ) {
			wfDebugLog( 'thumbnail',
				sprintf( 'thumbnail failed on %s: error %d "%s" from "%s"',
				wfHostname(), $retval, trim( $err ), $cmd ) );
			return new MediaTransformError( 'thumbnail_error', $width, $height, $err );
		} else {
			return new ThumbnailImage( $image, $dstUrl, $width, $height, $dstPath );
		}
	}

	/**
	 * @param File $file
	 * @param string $path Unused
	 * @param bool|array $metadata
	 * @return array
	 */
	function getImageSize( $file, $path, $metadata = false ) {
		return array( 5120, 2880 );
	}

	function getThumbType( $ext, $mime, $params = null ) {
		return [ 'png', 'image/png' ];
	}
}
