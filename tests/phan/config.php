<?php
$cfg = require __DIR__ . '/../../vendor/mediawiki/mediawiki-phan-config/src/config.php';
$cfg['suppress_issue_types'][] = 'PhanParamSignatureMismatch';
return $cfg;
