# grunt-jasmine-node-coverage

> Runs jasmine with Istanbul code coverage

[![Dependency Status](https://david-dm.org/jribble/grunt-jasmine-node-coverage.svg)](https://david-dm.org/jribble/grunt-jasmine-node-coverage)
[![devDependency Status](https://david-dm.org/jribble/grunt-jasmine-node-coverage/dev-status.svg)](https://david-dm.org/jribble/grunt-jasmine-node-coverage#info=devDependencies)
[![Build Status](https://travis-ci.org/jribble/grunt-jasmine-node-coverage.svg)](https://travis-ci.org/jribble/grunt-jasmine-node-coverage)
[![Built with Grunt](http://img.shields.io/badge/Grunt-1.0-blue.svg?style=flat-square)](http://gruntjs.com/)
[![Analytics](https://ga-beacon.appspot.com/UA-2643697-15/grunt-jasmine-node-coverage/index?flat)](https://github.com/igrigorik/ga-beacon)

A [Grunt](http://gruntjs.com/) task to run your [Jasmine](http://jasmine.github.io/)
feature suite using [jasmine-npm](https://github.com/jasmine/jasmine-npm)
and [Istanbul](https://github.com/gotwarlost/istanbul) for code coverage reports.

The minimum supported Node.js version is `4.2.0` (LTS), and while works also in `0.10.x`, no quarantees are given.

## Getting Started

Install this grunt plugin next to your project's `Gruntfile.js` with:

```sh
npm install grunt-jasmine-node-coverage --save-dev
```

Then add these lines to your project's `Gruntfile.js` configuration file:

```javascript
grunt.initConfig({
  jasmine_node: {
    task_name: {
      options: {
        forceExit: true,
        coverage: {
          includeAllSources: true
        },
        jasmine: {
          spec_dir: 'tests',
          spec_files: [
            '**/*spec.js'
          ]
        }
      },
      src: ['src/**/*.js']
    }
  }
});

grunt.loadNpmTasks('grunt-jasmine-node-coverage');

grunt.registerTask('default', 'jasmine_node');
```

## Configuring tasks

Grunt tasks should be configured by following
[the multi task configuration](http://gruntjs.com/creating-tasks#multi-tasks)
form, thus wrapping each configuration in an object inside the `jasmine_node` root object.

### Task configuration options

#### options.jasmine

Type: `object`

Default: see below

Jasmine specific configuration. Use empty object,
`{}` to use the defaults that are shown below.

```js
{
  spec_dir: 'spec',
  spec_files: ['**/*[sS]pec/.js'],
  helpers: [],
  reporters: {
    spec: {}
  }
}
```

See the [jasmine docs](http://jasmine.github.io/2.4/node.html#section-Configuration) for more information on the supported configuration.

The `reporters` property allows the following properties:

* `spec`: used to configure the [Jasmine spec reporter](https://github.com/bcaudan/jasmine-spec-reporter).
* `teamcity` set it to `true` in order to use [Jasmine Reporters - TeamCityReporter](https://github.com/larrymyers/jasmine-reporters).
* `junitXml` set it to a object to use [Jasmine Reporters - JUnitXmlReporter](https://github.com/larrymyers/jasmine-reporters).  See the jasmine-reporters
documentation for additional configuration options.

If `teamcity` reporter is set `spec` reporter will be disabled and `teamcity` reporter will be added to the coverage reporters as well.

Example of using `teamcity` reporter:

```js
{
  spec_dir: 'spec',
  spec_files: ['**/*[sS]pec/.js'],
  helpers: [],
  reporters: {
    teamcity: true
  }
}
```

Example of using `junitXml` reporter:

```js
{
  spec_dir: 'spec',
  spec_files: ['**/*[sS]pec/.js'],
  helpers: [],
  reporters: {
    junitXml: {
      savePath: "reports",
      consolidateAll: true
    }
  }
}
```

#### options.coverage

Type: `object`

Default: see below

Istanbul specific configuration. Use empty object,
`{}` to use the defaults that are shown below.

```js
{
  reportFile: 'coverage.json',
  relativize: true,
  thresholds: {
    statements: 0,
    branches: 0,
    lines: 0,
    functions: 0
  },
  watermarks: {
    statements: [50, 80],
    lines: [50, 80],
    functions: [50, 80],
    branches: [50, 80],
  },
  includeAllSources: false,
  reportDir: 'coverage',
  report: [
    'lcov',
    'text-summary'
  ],
  collect: [ // false to disable, paths are relative to 'reportDir'
    '*coverage.json'
  ],
  excludes: []
}
```

Notes:

* The `excludes` list will automatically include `'**/node_modules/**'` internally.
* Setting the `thresholds` values greater than `0` will cause the task to fail if the specified threshold is not met.
* The `watermarks` config changes the thresholds at which the reports are displayed in red, yellow and green. It does not affect the outcome of the task.
* Setting the `report` list will allow different types of istanbul report to be set.


#### options.projectRoot

Type: `string`

Default: `process.cwd()`

See http://nodejs.org/api/process.html#process_process_cwd


#### options.forceExit

Type: `boolean`

Default: `false`

Exit on failure by skipping any asynchronous tasks pending.


#### options.captureExceptions

Type: `boolean`

Default: `false`

If set to `true`, will log all uncaught exceptions.


#### options.isVerbose

Type: `boolean`

Default: `false`

When `true`, istanbul will print more information when running.


## Bugs

Help us to squash them by submitting an issue that describes how you encountered it;
please be as specific as possible including operating system, `node`, `grunt`, and
`grunt-jasmine-node-coverage` versions.

```sh
npm --versions
```

## Migration notes

### v1.x -> v2.x

The `spec` reporter configuration has changed for v2 of this plugin. The following is an example of the change in configuration that is needed. This is not an exhaustive list: refer to the [jasmine-spec-reporter](https://github.com/bcaudan/jasmine-spec-reporter) for a full reference of the configuration options.

```js
// v1
reporters: {
  spec: {
    colors: true,
    displayStacktrace: 'summary',
    displaySuccessfulSpec: true
  }
}

// v2
reporters: {
  spec: {
    colors: {
      enabled: true
    },
    summary: {
      displayStacktrace: true
    },
    spec: {
      displaySuccessful: true
    }
  }
}
```


### v0.x -> v1.x

If you are updating to `v1.x`, you'll need to update your Gruntfile.

The following example outlines the changes needed. It assumes the following folder structure:

```
app/
├── src/
│   ├── abacus.js
│   └── calculator.js
└── test/
    ├── helpers.js
    └── specs/
        ├── abacus.spec.js
        └── calculator.spec.js
```

```js
// v0.5.0 config
{
  jasmine_node: {
    task_name: {
      options: {
        match: '.',
        matchAll: true,
        specFolders: ['test'],
        extensions: 'js',
        specNameMatcher: 'spec',
        useHelpers: true
      }
    }
  }
}

// v1.0.0 config
{
  jasmine_node: {
    task_name: {
      options: {
        jasmine: {
          spec_dir: 'test',
          spec_files: [
            'specs/*.spec.js'
          ],
          helpers: [
            'helpers.js'
          ]
        }
      }
    }
  }
}
```

Please note that the junit reporter is no longer available. If you are using this reporter and wish to update to v1, please open a new issue and we'll see if we can get it added back in. Even better, submit a PR :smile:

## Release History

* `v2.0.1` (2017-09-20)
  - Looks like the compatibility between different dependencies requires to use `jasmine` of version `2.5.2`, which is not the latest (`2.5.3`)
* `v2.0.0` (2017-09-20)
  - **Breaking changes alert! Ensure you read the migration guide before updating from previous versions**
  - Updated to jasmine-spec-reporter `v3.3.0`. Older style configuration needs to be updated, see migration guide for more details.
  - Removed support for Node.js `v0.10`
* `v1.2.0` (2017-04-30)
  - Was compatible with Grunt `0.4` all the time, hence lowering the dependency requirement #60
* `v1.1.1` (2016-08-29)
  - Istanbul `v0.4.5` and using `data.src` instead of `fileSrc` for compatibility #59
* `v1.1.0` (2016-08-23)
  - Add Node.js `v0.10.0` support back by using `var` instead of `const` and `let`, #55
  - Teamcity reporter for Jasmine, #56
* `v1.0.0` (2016-07-23)
  - **Breaking changes alert! Ensure you read the migration guide before updating from previous versions**
  - Minimum supported Node.js version is `4.2.0` (LTS), removed testing against `0.10`
  - Migrated from `jasmine-node` to `jasmine-npm` #35 #48
  - Support `includeAllSources` istanbul coverage option #45 #50
  - Support thresholds for passing/failing build #25
  - Removed junit reporter
* `v0.5.0` (2016-05-03)
  - Grunt.js version 1.0 support
  - ESLint configuration migration to 2.0
  - Remove bin path #29
  - Update license property for todays requirements
  - Do not always make `lcov` output
* `v0.4.1` (2015-02-27)
  - Reports should be collected from where they were written #42
* `v0.4.0` (2015-02-19)
  - Other Grunt tasks were not ran when this failed, #40
* `v0.3.2` (2015-02-04)
  - Fixes for failure cases and documentation, #33, #36, #37 and #38
* `v0.3.1` (2014-11-21)
  - Installation failed
  - Should fix #30
* `v0.3.0` (2014-11-09)
  - Grunt usage as multi task
  - Fixes #12 and #18
* `v0.2.0` (2014-11-03)
  - Better Grunt API usage
  - Fixes #10, #13, #14, #16, #19 and #20
* `v0.1.11` (2014-05-15)
  -  Task name fix for `grunt.renametask` use case
* `v0.1.10` (2014-04-07)
  -  JSHint configuration and task exit fixes
* `v0.1.9` (2014-04-02)
  - Configuration for `jasmine_node.options.isVerbose` was not working
* `v0.1.8` (2014-03-03)
  - Add captureExceptions support and quit on exception
* `v0.1.7` (2013-12-13)
  - Istanbul update, threshold configuration and JUNit output
* `v0.1.6` (2013-07-26)
  - Change `isVerbose` option to `verbose`
* `v0.1.5` (2013-07-15)
  - Initial coverage with Istanbul release, originally forked from `grunt-jasmine-node`

## License

Copyright (c) 2013 "jribble" Jarrod Ribble & contributors.
Based on [grunt-jasmine-node](https://github.com/jasmine-contrib/grunt-jasmine-node).

Copyright (c) 2012 "s9tpepper" Omar Gonzalez & contributors.
Licensed under the MIT license.

[jasmine-node]: https://github.com/mhevery/jasmine-node "Integration of Jasmine Spec framework with Node.js"
