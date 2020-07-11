<?php

namespace MediaWiki\Extensions\ThreeD;

use MediaWiki\Shell\Shell;

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
	 * @param \File $file
	 * @return bool
	 */
	public function mustRender( $file ) {
		return true;
	}

	/**
	 * @param \File $file
	 * @return bool
	 */
	public function isVectorized( $file ) {
		return true;
	}

	/**
	 * @param \File $image
	 * @param array &$params
	 * @return bool
	 */
	public function normaliseParams( $image, &$params ) {
		global $wgSVGMaxSize;
		if ( !parent::normaliseParams( $image, $params ) ) {
			return false;
		}
		// Note: the annotation below is incomplete to save up space, expand if necessary
		'@phan-var array{physicalWidth:int,physicalHeight:int} $params';

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
		global $wg3dProcessor, $wg3dProcessEnviron, $wgMax3d2pngMemory;

		// Impose an aspect ratio
		$params['height'] = (int)round( $params['width'] / ( 640 / 480 ) );

		if ( $flags & self::TRANSFORM_LATER ) {
			return new ThreeDThumbnailImage( $image, $dstUrl, $dstPath, $params );
		}

		$width = $params['width'];
		$height = $params['height'];

		if ( !wfMkdirParents( dirname( $dstPath ), null, __METHOD__ ) ) {
			return new \MediaTransformError(
				'thumbnail_error',
				$width,
				$height,
				wfMessage( 'thumbnail_dest_directory' )
			);
		}

		$srcPath = $image->getLocalRefPath();

		// $wg3dProcessor can be string (e.g. '/path/to/3d2png.js') or array
		// (e.g. ['xvfb-run', '-a', '-s', '-ac -screen 0 1280x1024x24', '/path/to/3d2png.js'])
		$cmd = Shell::command( array_merge( (array)$wg3dProcessor,
			[
				$srcPath,
				sprintf( '%dx%d', $width, $height ),
				$dstPath,
			] )
		)
			->limits( [ 'memory' => $wgMax3d2pngMemory ] )
			->environment( $wg3dProcessEnviron )
			->profileMethod( __METHOD__ );

		$result = $cmd->execute();

		if ( $result->getExitCode() !== 0 ) {
			$err = trim( $result->getStdout() );
			wfDebugLog( 'thumbnail',
				sprintf( 'thumbnail failed on %s: error %d "%s" from "%s"',
				wfHostname(), $result->getExitCode(), $err, $cmd )
			);
			return new \MediaTransformError( 'thumbnail_error', $width, $height, $err );
		} else {
			return new ThreeDThumbnailImage( $image, $dstUrl, $dstPath, $params );
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

	/**
	 * @param string $ext
	 * @param string $mime
	 * @param array|null $params
	 * @return array
	 */
	public function getThumbType( $ext, $mime, $params = null ) {
		return [ 'png', 'image/png' ];
	}
}
