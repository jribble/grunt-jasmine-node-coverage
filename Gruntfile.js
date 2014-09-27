module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
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

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['jshint', 'jasmine_node']);
  grunt.registerTask('test', ['default']);

};
