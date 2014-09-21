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
          forceExit: true,
          match: '.',
          matchall: false,
          specFolders: ['spec'],
          extensions: 'js',
          specNameMatcher: 'spec',
          junitreport: {
            report: false,
            savePath: './build/reports/jasmine/',
            useDotNotation: true,
            consolidate: true
          }
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
