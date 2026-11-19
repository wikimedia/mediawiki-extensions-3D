'use strict';

const { defineConfig, globalIgnores } = require( 'eslint/config' );
const wikimedia = require( 'eslint-config-wikimedia/flat' );

// Directories with their own config, which other configs don't apply to.
// These were directories with `"root": true` in .eslintrc.json.
const rootDirs = {
	modules: [ 'modules/**' ]
};

module.exports = defineConfig( [
	globalIgnores( [
		// Upstream code
		'modules/lib/*',
		'modules/lib/*/',
		'!modules/lib/foreign-resources.*',

		// Build
		'vendor/',
		'docs/',

		// Language files written automatically by TranslateWiki
		'**/i18n/**/*.json',
		'!**/i18n/**/en.json',
		'!**/i18n/**/qqq.json'
	] ),

	// Gruntfile.js, etc.
	{
		ignores: Object.values( rootDirs ).flat(),
		extends: [ wikimedia( 'server' ) ]
	},

	// Code which runs in MediaWiki
	{
		files: rootDirs.modules,
		extends: [ wikimedia( 'client', 'jquery', 'mediawiki' ) ],
		languageOptions: {
			globals: {
				THREE: 'readonly'
			}
		}
	},
	{
		files: [ 'modules/lib/foreign-resources.*' ],
		rules: {
			'max-len': 'off'
		}
	}
] );
