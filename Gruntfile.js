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
          coverage: {},
          isVerbose: true,
          showColors: true,

          forceExit: false,
          match: '.',
          matchall: false,
          specFolders: ['spec'],
          extensions: 'js',
          specNameMatcher: 'spec'
        },
        src: ['tasks/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['jshint', 'jasmine_node']);
  grunt.registerTask('test', ['default']);

};
