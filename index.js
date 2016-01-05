'use strict';

const git = require('git-child');
const del = require('del');
const chalk = require('chalk');
const exec = require('promised-exec');
const argv = require('yargs').argv;

const RELEASES_BRANCH = process.env.BR_RELEASES_BRANCH || argv.b || 'releases';
const GH_TOKEN = process.env.GH_TOKEN || argv.t;
const DIST_DIR = process.env.BR_DIST_DIR || argv.d || 'dist';
const COMMIT_MESSAGE = process.env.BR_DIST_DIR || argv.m || 'Release v%ver%';
const BUILD_SCRIPT = process.env.BR_BUILD_SCRIPT || argv.s || 'build-dist';

function main() {
  branchRelease()
  .then(() => {
    log(chalk.green("Released successfully"))
  })
  .catch(err => fail(err));
}

function branchRelease() {
  return wasVersionChanged().then(versions => {
    if (versions[0] !== versions[1]) return buildAndPublish(versions[1]);
    log(chalk.green('Package version was not changed'));
  });
}

function wasVersionChanged() {
  let version;
  return git.checkout('master')
  .then(() => git.show('HEAD:package.json'))
  .then(contents => {
    version = JSON.parse(contents).version;
    return git.show('HEAD^:package.json')
  })
  .then(contents => {
    const prevVersion = JSON.parse(contents).version;
    return [prevVersion, version];
  })
}

function buildAndPublish(version) {
  log(`running: 'git checkout -B ${RELEASES_BRANCH}'`);
  return git.checkout({B: RELEASES_BRANCH})
  .then(() => {
    log(`running: 'git merge master'`);
    return git.merge('master');
  })
  .then(() => {
    log('Clearing dist folder');
    return del([ DIST_DIR + '/**/*' ]);
  })
  .then(() => {
    let buildCommand = `npm run-script ${BUILD_SCRIPT}`;
    log(`running: '${buildCommand}'`);
    return exec(buildCommand);
  })
  .then(() => {
    log(`running: 'git add .'`);
    return git.add('.');
  })
  .then(() => {
    log(`running: 'git add ${DIST_DIR} -f'`);
    return git.add({
      _: DIST_DIR,
      f: true
    });
  })
  .then(() => {
    const commitMessage = COMMIT_MESSAGE.replace('%ver%', version);
    log(`running: 'git commit -m ${commitMessage}'`);
    return git.commit({m: commitMessage});
  })
  .then(() => {
    log(`running: 'git tag ${version}'`);
    return git.tag(version);
  })
  .then(() => {
    return git.config({
      'get': 'remote.origin.url'
    });
  })
  .then((remoteUrl) => {
    let repoRef = remoteUrl.split('@').length > 1 ? remoteUrl.split('@')[1] : remoteUrl;
    log(`running: 'git push --follow-tags'`);
    return git.push({
      'follow-tags': true,
      '_': `"https://${GH_TOKEN}@${repoRef}"`
    });
  })
  .finally(() => git.checkout('master'))
}

function log() {
  console.log.apply(console, arguments);
}

function fail(err) {
  let message = err.message || err.string;
  log(chalk.red('Release failed:'))
  log(chalk.red(message));
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = branchRelease;
