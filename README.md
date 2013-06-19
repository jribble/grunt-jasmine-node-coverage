# grunt-jasmine-node-coverage

A grunt.js task to run your jasmine feature suite using jasmine-node and istanbul for code coverage reports.

## Getting Started
Install this grunt plugin next to your project's grunt.js gruntfile with: `npm install grunt-jasmine-node-coverage`

Then add this line to your project's `grunt.js` grunt file:

```javascript
grunt.initConfig({
  jasmine_node: {
    coverage: {

    },
    options: {
      forceExit: true,
      match: '.',
      matchall: false,
      extensions: 'js',
      specNameMatcher: 'spec',
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

## Bugs

Help us squash them by submitting an issue that describes how you encountered it; please be as specific as possible including operating system, node, grunt, and grunt-jasmine-node-coverage versions.

## Release History

see [GitHub Repository](/jribble/grunt-jasmine-node-coverage).

## License
Copyright (c) 2013 "jribble" Jarrod Ribble & contributors.
Based on grunt-jasmine-node (https://github.com/jasmine-contrib/grunt-jasmine-node) Copyright (c) 2012 "s9tpepper" Omar Gonzalez & contributors.
Licensed under the MIT license.
