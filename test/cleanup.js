#! /usr/bin/env node

const path = require('path');
const { removeSync, mkdirsSync } = require('fs-extra');

const GUT_TESTS_REPOSITORY_PATH = path.resolve(__dirname, 'repositories');

removeSync(GUT_TESTS_REPOSITORY_PATH);
mkdirsSync(GUT_TESTS_REPOSITORY_PATH);

