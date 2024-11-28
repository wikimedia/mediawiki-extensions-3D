'use strict';
const path = require( 'path' );

module.exports = function ( grunt ) {
	const conf = grunt.file.readJSON( 'extension.json' );

	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-stylelint' );
	grunt.loadNpmTasks( 'grunt-webpack' );

	grunt.initConfig( {
		eslint: {
			options: {
				cache: true,
				fix: grunt.option( 'fix' )
			},
			all: [ '.' ]
		},
		banana: conf.MessagesDirs,
		stylelint: {
			all: [
				'modules/**/*.{less,css}'
			]
		},
		webpack: {
			build: {
				entry: './modules/lib/three/three.in.js',
				mode: 'production',
				output: {
					path: path.resolve( __dirname, 'modules/lib/three' ),
					publicPath: '',
					filename: 'three.js',
					libraryTarget: 'umd',
					library: 'THREE'
				}
			}
		}
	} );

	grunt.registerTask( 'test', [ 'eslint:all', 'stylelint', 'banana' ] );
	grunt.registerTask( 'fix', [ 'eslint:fix' ] );
	grunt.registerTask( 'build', 'webpack:build' );
	grunt.registerTask( 'default', 'test' );
};
