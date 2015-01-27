
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

  grunt.registerTask('default', ['eslint', 'jasmine_node']);
  grunt.registerTask('test', ['default']);

};
