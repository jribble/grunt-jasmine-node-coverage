# grunt-jasmine-node-coverage

> Runs jasmine-node with Istanbul code coverage

A Grunt task to run your Jasmine feature suite using jasmine-node and istanbul for code coverage reports.

## Getting Started

Install this grunt plugin next to your project's `Gruntfile.js` with: `npm install grunt-jasmine-node-coverage`

Then add these lines to your project's `Gruntfile.js` configuration file:

```javascript
grunt.initConfig({
  jasmine_node: {
    task_name: {
      options: {
        coverage: {},
        forceExit: true,
        match: '.',
        matchall: false,
        specFolders: ['tests'],
        extensions: 'js',
        specNameMatcher: 'spec',
        captureExceptions: true,
        junitreport: {
          report: false,
          savePath : './build/reports/jasmine/',
          useDotNotation: true,
          consolidate: true
        }
      },
      src: ['**/*.js']
    }
  }
});

grunt.loadNpmTasks('grunt-jasmine-node-coverage');

grunt.registerTask('default', 'jasmine_node');
```

## Configuring tasks

Grunt tasks should be configured by following [the multi task configuration](http://gruntjs.com/creating-tasks#multi-tasks)
form, thus wrapping each configuration in an object inside the `jasmine_node` root object.

### Task configuration options

Most of the options are passed throught to [jasmine-node][].


#### options.projectRoot

Type: `string`

Default: `process.cwd()`

See http://nodejs.org/api/process.html#process_process_cwd

#### options.specFolders

Type: `array`

Default: `[options.projectRoot]`

List of folders in which any specs are looked for.

#### options.useHelpers

Type: `boolean`

Default: `false`

#### options.coverage

Type: `boolean|object`

Default: `false`

Istanbul specific configuration. Use empty object,
`{}` to use the defaults that are shown below.

```js
{
  reportFile: 'coverage.json',
  print: 'summary', // none, summary, detail, both
  relativize: true,
  thresholds: {
    statements: 0,
    branches: 0,
    lines: 0,
    functions: 0
  },
  savePath: 'coverage',
  report: [
    'lcov'
  ],
  collect: [ // false to disable
    'coverage/*coverage.json'
  ]
}
```

#### options.showColors

Type: `boolean`

Default: `false`

#### options.isVerbose

Type: `boolean`

Default: `true`

When `true` and `options.teamcity` is `false`, will use
`TerminalVerboseReporter`, else `TerminalReporter`.

#### options.forceExit

Type: `boolean`

Default: `false`

Exit on failure

#### options.match

Type: `string`

Default: `'.'`

used in the beginning of regular expression

#### options.matchall

Type: `boolean`

Default: `false`

if false, the specNameMatcher is used, true will just be ''

#### options.specNameMatcher

Type: `string`

Default: `'spec'`

filename expression

#### options.extensions

Type: `string`

Default: `'js'`

Used in regular expressions after dot, inside (), thus | could be used

#### options.captureExceptions

Type: `boolean`

Default: `false`

#### options.junitreport

```js
{
  report: false,
  savePath: './reports/',
  useDotNotation: true,
  consolidate: true
}
```

#### options.teamcity

Type: `boolean`

Default: `false`

If `true`, will be using `TeamcityReporter` instead of possible `isVerbose` option


#### options.growl

Type: `boolean`

Default: `false`

When `true` will be adding `GrowlReporter`.

#### options.useRequireJs

Type: `boolean`

Default: `false`

#### options.onComplete

Type: `function`

Default: `null`

Will be called on Terminal and Teamcity reporters and on RequireJs runner.


#### options.includeStackTrace

Type: `boolean`

Default: `false`

Used only in `TerminalReporter`.

#### options.coffee

Type: `boolean`

Default: `false`

Seems to be currently (1.4.3) only supported in the command line options of jasmine-node.

## Bugs

Help us to squash them by submitting an issue that describes how you encountered it;
please be as specific as possible including operating system, node, grunt, and grunt-jasmine-node-coverage versions.

```sh
npm --versions
```

## Release History

see [GitHub Repository](/jribble/grunt-jasmine-node-coverage).

## License

Copyright (c) 2013 "jribble" Jarrod Ribble & contributors.
Based on grunt-jasmine-node (https://github.com/jasmine-contrib/grunt-jasmine-node)

Copyright (c) 2012 "s9tpepper" Omar Gonzalez & contributors.
Licensed under the MIT license.

[jasmine-node]: https://github.com/mhevery/jasmine-node "Integration of Jasmine Spec framework with Node.js"
