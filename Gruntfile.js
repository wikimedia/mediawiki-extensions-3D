/* eslint-env node, es6 */
module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-stylelint' );

	grunt.initConfig( {
		eslint: {
			options: {
				reportUnusedDisableDirectives: true,
				extensions: [ '.js', '.json' ],
				cache: true
			},
			all: [
				'*.js{,on}',
				'modules/**/*.js{,on}',
				'!modules/three/**'
			]
		},
		banana: {
			all: 'i18n/'
		},
		stylelint: {
			all: [
				'modules/**/*.{less,css}'
			]
		}
	} );

	grunt.registerTask( 'test', [ 'eslint:all', 'stylelint', 'banana' ] );
	grunt.registerTask( 'fix', [ 'eslint:fix' ] );
	grunt.registerTask( 'default', 'test' );
};
