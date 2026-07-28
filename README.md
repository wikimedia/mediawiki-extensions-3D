# 3D

The 3D extension enables MediaWiki to upload, generate thumbnails for, and
interactively view 3D models.

It currently supports the STL file format (`application/sla`), which is common
in 3D printing. Thumbnails are rendered via
[3d2png](https://www.mediawiki.org/wiki/Extension:3D#Install_3d2png).
Interactive viewing (pan, zoom, rotate) is available when
[Extension:MultimediaViewer](https://www.mediawiki.org/wiki/Extension:MultimediaViewer)
is installed.

## Documentation

- [Help:Extension:3D](https://www.mediawiki.org/wiki/Help:Extension:3D) — end-user documentation
- [Extension:3D](https://www.mediawiki.org/wiki/Extension:3D) — technical documentation

## Installation

Refer to the [Extension:3D](https://www.mediawiki.org/wiki/Extension:3D) page
for installation instructions, including enabling STL uploads,
configuring the 3d2png thumbnailer, and associating STL files with MultimediaViewer.

## Configuration

Configuration is documented on the
[Extension:3D](https://www.mediawiki.org/wiki/Extension:3D) page.

## Development

- **Code Review via Gerrit**: [mediawiki/extensions/3D](https://gerrit.wikimedia.org/g/mediawiki/extensions/3D)
- **Issue tracker via Phabricator**: [3D project](https://phabricator.wikimedia.org/tag/3d/)
- **Contributing guidelines**: refer to [CONTRIBUTING.md](CONTRIBUTING.md)

## Testing

From the extension directory, run:

```sh
composer test
grunt test
```

`composer test` runs the PHP linting and coding style checks.
`grunt test` runs ESLint and Stylelint to lint JavaScript and CSS/Less files for code style and errors.
