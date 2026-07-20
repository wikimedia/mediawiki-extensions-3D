# 3D Contributing Guide

## Welcome

Welcome to the 3D Contributing Guide, and thank you for your interest.

This guide describes the main ways you can contribute to Extension:3D,
including:

- Bug reports and bug fixes
- Documentation improvements

We do not currently accept feature requests because the extension's support status is undecided. However, please discuss significant new features with [maintainers][maintainers] before beginning implementation.

### Overview

3D is a MediaWiki extension that provides support for uploading and viewing
3D models. It currently supports the STL file format.

For more information, refer to the [Extension:3D][mw-extension] and
[Help:Extension:3D][help-3d] pages on mediawiki.org.

### Community engagement

Refer to the following channels to connect with fellow contributors or to stay
up-to-date with news about 3D:

- Follow tasks and discussion on [Phabricator][phabricator-workboard].
- Participate in discussions in [Village Pump][village-pump].
- Stay updated on the latest news and changes to the project by following
  [MediaWiki's version lifecycle page][version-lifecycle].

## Contributing

### Code of conduct

Before contributing, read our [Code of Conduct][coc] to learn more about our
community guidelines and expectations.

### Bug reports

We use Phabricator to track tasks and bug reports. To report a bug:

1. **Search for existing issues**: Check if the issue has already been reported
   in [Phabricator][phabricator-workboard].
2. **Create a new task**: If the issue doesn't exist, create a new task in
   Phabricator.
3. **Provide details**: Include:
   - A clear description of the issue
   - Steps to reproduce
   - Expected vs. actual behavior
   - Your environment (MediaWiki version, browser, etc.)
   - Screenshots or error messages if applicable

### Proposals and feature requests

To share your new ideas for the project, perform the following actions:

1. Create an issue on [Phabricator][phabricator-workboard].
2. Describe your idea clearly, including the problem you're trying to solve.
3. Wait for feedback from maintainers before starting implementation.

### Code contribution

3D uses [Gerrit][gerrit] for code review. For installation and configuration
instructions, refer to the [Extension:3D][mw-extension] page. For Gerrit workflow
and general MediaWiki contribution practices, refer to the
[Gerrit/Tutorial][gerrit-tutorial] and [How to become a MediaWiki
hacker][mw-hacker].

Before submitting a patch, run:

```sh
composer test
npm test
```

[mw-extension]: https://www.mediawiki.org/wiki/Extension:3D
[help-3d]: https://www.mediawiki.org/wiki/Help:Extension:3D
[maintainers]: https://www.mediawiki.org/wiki/Developers/Maintainers
[village-pump]: https://en.wikipedia.org/wiki/Wikipedia:Village_pump
[version-lifecycle]: https://www.mediawiki.org/wiki/Version_lifecycle
[coc]: CODE_OF_CONDUCT.md
[phabricator-workboard]: https://phabricator.wikimedia.org/tag/3d/
[gerrit]: https://www.mediawiki.org/wiki/Gerrit
[gerrit-tutorial]: https://www.mediawiki.org/wiki/Gerrit/Tutorial
[mw-hacker]: https://www.mediawiki.org/wiki/How_to_become_a_MediaWiki_hacker
