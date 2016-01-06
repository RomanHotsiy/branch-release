branch-release
=====
Build and tag package release on a separate branch

A whole lot of front-end packages keep their dist files directly in the master branch. This is required for package managers that rely on tags (e.g. Bower). Are you tired of this pollution? Then this tool is for you!

![Carl and Rick about storing dist in master](http://i.imgur.com/YXgba3U.jpg "Carl and Rick about storing dist in master")

## How does it work?
It uses special `releases` branch and keep all the built files there and tag it as well.
It looks like this:
- check if package version was changed by latest commit and if wasn't - exit
- `git checkout -B releases`
- `git merge master` (this merge won't produce any conflicts as on master branch you change only src files and on releases only dist files are changed)
- Building dist files: `npm run-task build-dist`
- `git add dist -f`
- `git commit -m "Release <version>"`
- `git tag <version>`
- `git push --follow-tags`
- `git checkout master`

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

## Credits
Special thanks goes to [@IvanGoncharov](https://github.com/IvanGoncharov) for the idea and motivation :smile:
