
'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    eslint: {
      options: {
        config: '.eslintrc'
      },
      all: ['tasks/*.js']
    },
    jasmine_node: {
      all: {
        options: {
          coverage: {
            print: 'detail'
          },
          isVerbose: true,
          showColors: true,

          forceExit: true,
          match: '.',
          matchAll: false,
          specFolders: ['spec'],
          extensions: 'js',
          specNameMatcher: 'spec'
        },
        src: [
          'spec/calculator.js',
          'spec/obj-util.js'
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
