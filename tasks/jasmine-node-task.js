module.exports = function (grunt) {
  'use strict';

  var istanbul = require('istanbul'),
    jasmine = require('jasmine-node'),
    merge = require('deepmerge'),
    path = require('path'),
    fs = require('fs');

  var reportingDir,
    coverageVar = '$$cov_' + new Date().getTime() + '$$',
    fileSrc = ['**/*.js'],
    options,
    done,
    reports = [];

  var coverageCollect = function (covPattern, collector) {

    var coverageFiles = grunt.file.expand(covPattern);

    coverageFiles.forEach(function (coverageFile) {
      var contents = fs.readFileSync(coverageFile, 'utf8');
      var fileCov = JSON.parse(contents);
      if (options.coverage.relativize) {
        var cwd = process.cwd();
        var newFileCov = {};
        for (var key in fileCov) {
          var item = fileCov[key];
          var filePath = item.path;
          var relPath = path.relative(cwd, filePath);
          item.path = relPath;
          newFileCov[relPath] = item;
        }
        fileCov = newFileCov;
      }
      collector.add(fileCov);
    });
  };

  var coverageThresholdCheck = function (collector) {

    // Check against thresholds
    collector.files().forEach(function (file) {
      var summary = istanbul.utils.summarizeFileCoverage(
        collector.fileCoverageFor(file)
      );

      Object.keys(options.coverage.thresholds).forEach(function (metric) {
        var threshold = options.coverage.thresholds[metric];
        var actual = summary[metric];
        if (!actual) {
          grunt.warn('unrecognized metric: ' + metric);
        }
        if (actual.pct < threshold) {
          grunt.warn('expected ' + metric + ' coverage to be at least ' + threshold +
          '% but was ' + actual.pct + '%' + '\n\tat (' + file + ')');
        }
      });
    });
  };

  var exitHandler = function () {
    var reportFile = path.resolve(reportingDir, options.coverage.reportFile),
      collector,
      cov;

    if (typeof global[coverageVar] !== 'object' || Object.keys(global[coverageVar]).length === 0) {
      grunt.log.error('No coverage information was collected, exit without writing coverage information');
      return;
    }

    cov = global[coverageVar];

    //important: there is no event loop at this point
    //everything that happens in this exit handler MUST be synchronous
    grunt.file.mkdir(reportingDir); //yes, do this again since some test runners could clean the dir initially created
    if (options.coverage.print !== 'none') {
      grunt.log.writeln('=============================================================================');
      grunt.log.writeln('Writing coverage object [' + reportFile + ']');
    }
    fs.writeFileSync(reportFile, JSON.stringify(cov), 'utf8');
    collector = new istanbul.Collector();

    if (options.coverage.collect !== false) {
      options.coverage.collect.forEach(function (covPattern) {
        coverageCollect(covPattern, collector);
      });
    }
    else {
      collector.add(cov);
    }

    if (options.coverage.print !== 'none') {
      grunt.log.writeln('Writing coverage reports at [' + reportingDir + ']');
      grunt.log.writeln('=============================================================================');
    }

    reports.forEach(function (report) {
      report.writeReport(collector, true);
    });

    coverageThresholdCheck(collector);

  };

  var istanbulMatcherRun = function (matchFn) {

    var instrumenter = new istanbul.Instrumenter({coverageVariable: coverageVar}),
      transformer = instrumenter.instrumentSync.bind(instrumenter),
      hookOpts = {verbose: options.isVerbose};

    istanbul.hook.hookRequire(matchFn, transformer, hookOpts);

    //initialize the global variable to stop mocha from complaining about leaks
    global[coverageVar] = {};

    process.once('exit', exitHandler);
  };


  var runner = function () {


    if (options.captureExceptions) {
      // Grunt will kill the process when it handles an uncaughtException, so we need to
      // remove their handler to allow the test suite to continue.
      // A downside of this is that we ignore any other registered `ungaughtException`
      // handlers.
      process.removeAllListeners('uncaughtException');
      process.on('uncaughtException', function (e) {
        grunt.log.error('Caught unhandled exception: ', e.toString());
        grunt.log.error(e.stack);
      });
    }

    if (options.useHelpers) {
      jasmine.loadHelpersInFolder(
        options.projectRoot,
        new RegExp('helpers?\\.(' + options.extensions + ')$', 'i')
      );
    }

    try {
      jasmine.executeSpecsInFolder(options);
    }
    catch (e) {
      if (options.forceExit) {
        process.exit(1);
      }
      else {
        done(1);
      }
      grunt.log.error('Failed to execute "jasmine.executeSpecsInFolder": ' + e.stack);
    }
  };

  var doCoverage = function () {

    // set up require hooks to instrument files as they are required
    var Report = istanbul.Report;

    grunt.file.mkdir(reportingDir); //ensure we fail early if we cannot do this

    var reportClassNames = options.coverage.report;
    reportClassNames.forEach(function (reportClassName) {
      reports.push(Report.create(reportClassName, {dir: reportingDir}));
    });

    if (options.coverage.print !== 'none') {
      switch (options.coverage.print) {
        case 'detail':
          reports.push(Report.create('text'));
          break;
        case 'both':
          reports.push(Report.create('text'));
          reports.push(Report.create('text-summary'));
          break;
        case 'summary':
        default:
          reports.push(Report.create('text-summary'));
          break;
      }
    }

    var excludes = options.coverage.excludes || [];
    excludes.push('**/node_modules/**');

    istanbul.matcherFor({
      root: options.projectRoot,
      includes: fileSrc,
      excludes: excludes
    }, function (err, matchFn) {
      if (err) {
        grunt.warn(err);
        return;
      }
      istanbulMatcherRun(matchFn);
      runner();
    });

  };

  grunt.registerMultiTask('jasmine_node', 'Runs jasmine-node with Istanbul code coverage', function () {

    // Default options. Once Grunt does recursive merge, use that, maybe 0.4.6
    options = merge({

      // Used only in this plugin, thus can be refactored out
      projectRoot: '.', // string
      useHelpers: false, // boolean
      forceExit: false, // boolean, exit on failure
      match: '.', // string, used in the beginning of regular expression
      matchall: false, // boolean, if false, the specNameMatcher is used, true will just be ''
      specNameMatcher: 'spec', // string, filename expression
      extensions: 'js', // string, used in regular expressions after dot, inside (), thus | could be used
      captureExceptions: false, // boolean

      // Coverage options
      coverage: { // boolean|object
        reportFile: 'coverage.json',
        print: 'summary', // none, summary, detail, both
        collect: [
          'coverage/coverage*.json'
        ], // coverage report file matching patters
        relativize: true,
        thresholds: {
          statements: 0,
          branches: 0,
          lines: 0,
          functions: 0
        },
        reportDir: 'coverage',
        report: [
          'lcov'
        ]
      },

      // jasmine-node specific options
      specFolders: null, // array
      onComplete: null, // function
      isVerbose: true, // boolean
      showColors: false, // boolean
      teamcity: false, // boolean
      useRequireJs: false, // boolean
      regExpSpec: null, // RegExp written based on the other options
      gowl: false, // boolean, use jasmineEnv.addReporter(new jasmine.GrowlReporter());
      junitreport: {
        report: false, // boolean, create JUnit XML reports
        savePath: './reports/',
        useDotNotation: true,
        consolidate: true
      },
      includeStackTrace: false, // boolean
      growl: false, // boolean
      //coffee: false, // boolean
    }, this.options());


    fileSrc = this.filesSrc || fileSrc;
    reportingDir = path.resolve(process.cwd(), options.coverage.reportDir);

    // Tell grunt this task is asynchronous.
    done = this.async();

    // Default value in jasmine-node is new RegExp(".(js)$", "i")
    if (options.regExpSpec !== null) {
      options.regExpSpec = new RegExp(options.match + (options.matchall ? '' :
        options.specNameMatcher + '\\.') + '(' + options.extensions + ')$', 'i');
    }
    if (typeof options.onComplete !== 'function') {
      options.onComplete = function (runner, log) {
        var exitCode = 1;
        grunt.log.write('\n');
        if (runner.results().failedCount === 0) {
          exitCode = 0;
        }

        if (options.forceExit) {
          process.exit(exitCode);
        }
        done(exitCode === 0);
      };
    }

    if (options.specFolders === null) {
      options.specFolders = [options.projectRoot];
    }

    if (options.coverage !== false) {
      doCoverage();
    }
    else {
      runner();
    }
  });
};
