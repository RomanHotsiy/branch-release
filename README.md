branch-release
=====
Build and tag package release on a separate branch

A whole lot of front-end packages keep their dist files directly in the master branch. This is required for package managers that rely on tags (e.g. Bower). Are you tired of this pollution? Then this tool is for you!

![Carl and Rick about storing dist in master](http://i.imgur.com/YXgba3U.jpg "Carl and Rick about storing dist in master")

## How does it work?
It uses special `releases` branch and keep all the built files there and tag it as well.
It looks like this:
- check if current version (from `package.json`) is already tagged (released)
- `git checkout -B releases`
- `git merge master` (this merge won't produce any conflicts as on master branch you change only src files and on releases only dist files are changed)
- Building dist files: `npm run-task build-dist`
- `git add dist -f`
- `git commit -m "Release <version>"`
- `git tag <version>`
- `git push --follow-tags`
- `git checkout master`

## Requirements
 - Node v4+

## Installation
Local installation:

    npm install branch-release --save-dev

Global installation (**not recommended**):

    npm install branch-release -g

## Usage
This tool requires **npm script** that build dist files (by default script `build-dist` will be used)

In case of global installation you can use this tool via command-line:

    $ branch-release

But I recommend local installation and using it via npm scripts (npm bin directory is automatically added to PATH for scripts):

```json
...
"scripts": {
  "release-to-branch": "branch-release"
},
...
```

and then:

    npm run-script release-to-branch


## Configuration

You can configure this tool via both command-line options or environment variables:

- `-b <RELEASES_BRANCH>` or `BR_RELEASES_BRANCH` env variable: specifies branch to be used to publish releases. **Default**: `releases`
- `-t <GH_TOKEN>` or `GH_TOKEN` env variable: specifies GitHub access token.
- `-d <DIST_DIR>` or `BR_DIST_DIR` env variable: specifies dir to be used to store dist files. **Default**: `dist`
- `-s <BUILD_SCRIPT>` or `BR_BUILD_SCRIPT` env variable: specifies npm script to be run for building dist files. **Default**: `build-dist`
- `-m <COMMIT_MESSAGE>` or `BR_COMMIT_MESSAGE` env variable: specifies commit message. You can use `%ver%` placeholder which will be replaced with actual package version from `package.json`. **Default**: `'Release v%ver%'`

## Using with TravisCI
This tool works best with [TravisCI](https://travis-ci.org).
The sample repo that uses this tool with TravisCI: [branch-release-demo](https://github.com/RomanGotsiy/branch-release-demo)

Here is the example configuration:

_package.json_
```json
...
"scripts": {
    "test": "./test",
    "build-dist": "./build",
    "release-to-branch": "branch-release"
  },
...
```
`./test` and `./build` are here just for example. Use your actual routines.

_.travis.yml_
```yml
language: node_js
node_js:
- '4.0'
env:
  global:
  - GIT_AUTHOR_EMAIL: bot-account@users.noreply.github.com
  - GIT_AUTHOR_NAME: MyRepoTravisBot
  - GH_TOKEN: <your github token>
deploy:
  skip_cleanup: true
  provider: script
  script: npm run release-to-branch
  on:
    branch: master
```

**WARNING**: don't specify `GH_TOKEN` in cleartext, use [travis encrypted keys](https://docs.travis-ci.com/user/encryption-keys/) instead.

If you omit `skip_cleanup` field you should do `npm install` before run branch-release:
```yml
script: npm install && npm run branch-release
```
I recommend to use **machine user account** to push commits from TravisCI to Github. It's totally OK according to [Github guides](https://developer.github.com/guides/managing-deploy-keys/#machine-users)
## Credits
Special thanks goes to [@IvanGoncharov](https://github.com/IvanGoncharov) for the idea and motivation :smile:
