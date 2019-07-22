#!/usr/bin/env node

'use strict';
require('shelljs/global');
const chalk = require('chalk');
const argv = require('yargs').argv;
const semver = require('semver');
const GitUrlParse = require("git-url-parse");

const RELEASES_BRANCH = process.env.BR_RELEASES_BRANCH || argv.b || 'releases';
const GH_TOKEN = process.env.GH_TOKEN || argv.t;
const DIST_DIR = process.env.BR_DIST_DIR || argv.d || 'dist';
const COMMIT_MESSAGE = process.env.BR_DIST_DIR || argv.m || 'Release v%ver%';
const BUILD_SCRIPT = process.env.BR_BUILD_SCRIPT || argv.s || 'build-dist';

set('-v');
set('-e');

function main() {
  branchRelease();
}

function branchRelease() {
  exec('git stash');
  let version = getCurrentVersion();
  if (checkVersionIsTagged(version)) {
    console.log(chalk.green(`Version ${version} is already released. Exiting...`));
    return;
  }

  try {
    unshallow();
    buildAndPublish(version);
    console.log(chalk.green(`Released successfully...`));
  } catch(e) {
    console.log(chalk.red(safeOutput(e.message)));
    switchBack();
    process.exit(1);
  }
}

function getCurrentVersion() {
  let manifest = JSON.parse(exec('git show HEAD:package.json', {silent: true}).stdout);
  return semver.clean(manifest.version);
}

function switchBack() {
  exec('git reset --hard');
  exec('git checkout @{-1}');
  exec('git stash pop');
}

function checkVersionIsTagged(version) {
  let tags = exec('git ls-remote -t origin', {silent: true}).stdout;
  let re = new RegExp('\\D' + version.replace(/\./g, '\\.') + '$', 'm');
  return re.test(tags);
}

function unshallow() {
  set('+e');
  exec('git fetch --unshallow');
  set('-e');
}

function checkoutAndPull() {
  rm('-rf', DIST_DIR);
  var branches = exec('git ls-remote -h origin', {silent: true}).stdout;
  let re = new RegExp(`heads\\/${RELEASES_BRANCH}$`, 'm');
  if (re.test(branches)) {
    exec(`git fetch -f origin ${RELEASES_BRANCH}:${RELEASES_BRANCH}`);
    exec(`git checkout ${RELEASES_BRANCH}`);
  } else {
    exec(`git checkout -b ${RELEASES_BRANCH}`);
  }
}

function buildAndPublish(version) {
  checkoutAndPull();
  exec('git merge -X theirs @{-1}');
  exec(`npm run-script ${BUILD_SCRIPT}`);
  exec(`git add ${DIST_DIR} -f`);
  const commitMessage = COMMIT_MESSAGE.replace('%ver%', version);
  exec(`git commit -m "${commitMessage}" --allow-empty`);
  exec(`git tag v${version}`);
  let remote = 'origin';
  if (GH_TOKEN) {
    let remoteUrl = exec('git config --get remote.origin.url', {silent: true}).stdout.trim();
    let remoteObj = GitUrlParse(remoteUrl);
    remote = `https://${GH_TOKEN}@github.com${remoteObj.pathname}`;
  }
  safeExec(`git push ${remote} ${RELEASES_BRANCH}:${RELEASES_BRANCH}`);
  safeExec(`git push ${remote} --tags`);
}

function safeOutput(str) {
  return GH_TOKEN ? str.replace(new RegExp(GH_TOKEN, 'g'), 'xxPASSxx') : str;
}

function safeExec(command) {
  set('+v');
  set('+e');
  console.log(safeOutput(command));
  var res = exec(command, {silent:true});
  if (res.code == 0) {
    console.log(safeOutput(res.stdout || res.stderr));
  } else {
    console.log('push failed');
    throw Error(res.stderr);
  }
  set('-e');
  set('-v');
  return res;
}

if (require.main === module) {
  main();
}

module.exports = branchRelease;
