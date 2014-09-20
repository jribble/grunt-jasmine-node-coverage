# grunt-jasmine-node-coverage

A grunt.js task to run your jasmine feature suite using jasmine-node and istanbul for code coverage reports.

## Getting Started
Install this grunt plugin next to your project's grunt.js gruntfile with: `npm install grunt-jasmine-node-coverage`

Then add this line to your project's `grunt.js` grunt file:

```javascript
grunt.initConfig({
  jasmine_node: {
    options: {
      coverage: {
        print: '',
        collect: [...]
      },
      forceExit: true,
      match: '.',
      matchall: false,
      extensions: 'js',
      specNameMatcher: 'spec',
      captureExceptions: true,
      junitreport: {
        report: false,
        savePath : "./build/reports/jasmine/",
        useDotNotation: true,
        consolidate: true
      }
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

https://github.com/mhevery/jasmine-node


#### options.projectRoot

Type: `string`

Default: `'.'`

#### options.specFolders

Type: `array`

Default: `null`

Currently not in use...

#### options.useHelpers

Type: `boolean`

Default: `false`

#### options.coverage

Type: `boolean|object`

Default: `false`

Istanbul specific configuration.

#### options.colors: false, // boolean, also 'showColors' used, which is correct?

Type: `boolean`

Default: `false`

#### options.verbose: , // boolean, also 'isVerbose' used, which is correct?

Type: `boolean`

Default: `true`

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

#### options.teamcity: false, // boolean
#### options.useRequireJs: false, // boolean

## Bugs

Help us squash them by submitting an issue that describes how you encountered it; please be as specific as possible including operating system, node, grunt, and grunt-jasmine-node-coverage versions.

## Release History

see [GitHub Repository](/jribble/grunt-jasmine-node-coverage).

## License

Copyright (c) 2013 "jribble" Jarrod Ribble & contributors.
Based on grunt-jasmine-node (https://github.com/jasmine-contrib/grunt-jasmine-node)

Copyright (c) 2012 "s9tpepper" Omar Gonzalez & contributors.
Licensed under the MIT license.
