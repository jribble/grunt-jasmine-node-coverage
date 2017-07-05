
'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    eslint: {
      options: {
        config: '.eslintrc.json'
      },
      all: ['tasks/*.js']
    },
    jasmine_node: {
      all: {
        options: {
          coverage: {
            watermarks: {
              statements: [90, 95],
              lines: [90, 95],
              functions: [90, 95],
              branches: [90, 95],
            },
            thresholds: {
              statements: 90,
              lines: 90,
              functions: 90,
              branches: 90
            },
            // Uncomment line below to include
            // calculator2.js file in coverage reports
            // includeAllSources: true
          },
          isVerbose: true,
          forceExit: true,
          jasmine: {
            spec_dir: 'spec',
            spec_files: [
              '*spec.js'
            ],
            reporters: {
              spec: {
                colors: true
              },
              junitXml: {
                savePath: "reports",
                consolidateAll: true
              }
              // Uncomment line below to activate teamcity reporter
              //teamcity: true
            }
          }
        },
        src: [
          'src/*.js'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['eslint', 'jasmine_node', 'example-task']);
  grunt.registerTask('test', ['default']);
  grunt.registerTask('example-task',
    'An example task to prove that jasmine_node only applies `forceExit` when there is an error',
    function() {
      grunt.log.ok("Example task complete");
  });
};
