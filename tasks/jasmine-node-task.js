
'use strict';

// Native dependencies
var fs = require('fs'),
  path = require('path');

// 3rd party dependencies
var istanbul = require('istanbul'),
  Jasmine = require('jasmine'),
  SpecReporter = require('jasmine-spec-reporter').SpecReporter,
  deepmerge = require('deepmerge'),
  reporters = require('jasmine-reporters');

module.exports = function jasmineNodeTask(grunt) {

  var reports = [];

  var reportingDir,
    coverageVar = '$$cov_' + new Date().getTime() + '$$',
    fileSrc = ['**/*.js'],
    options,
    done;

  var coverageCollect = function coverageCollect(covPattern, collector) {

    // The pattern should be relative to the directory in which the reports are written
    var coverageFiles = grunt.file.expand(path.resolve(reportingDir, covPattern));

    coverageFiles.forEach(function eachFiles(coverageFile) {
      var contents = fs.readFileSync(coverageFile, 'utf8');
      var fileCov = JSON.parse(contents);
      if (options.coverage.relativize) {
        var cwd = process.cwd();
        var newFileCov = {};
        for (var key in fileCov) {
          if (fileCov.hasOwnProperty(key)) {
            var item = fileCov[key];
            var filePath = item.path;
            var relPath = path.relative(cwd, filePath);
            item.path = relPath;
            newFileCov[relPath] = item;
          }
        }
        fileCov = newFileCov;
      }
      collector.add(fileCov);
    });
  };

  var coverageThresholdCheck = function coverageThresholdCheck(collector) {

    // http://gotwarlost.github.io/istanbul/public/apidocs/classes/ObjectUtils.html
    var objUtils = istanbul.utils;

    // Check against thresholds
    collector.files().forEach(function eachFiles(file) {
      var summary = objUtils.summarizeFileCoverage(
        collector.fileCoverageFor(file)
      );

      Object.keys(options.coverage.thresholds).forEach(function eachKeys(metric) {
        var threshold = options.coverage.thresholds[metric];
        var actual = summary[metric];
        if (!actual) {
          grunt.fail.warn('unrecognized metric: ' + metric);
        }
        if (actual.pct < threshold) {
          grunt.fail.warn('expected ' + metric + ' coverage to be at least ' + threshold +
          '% but was ' + actual.pct + '%' + '\n\tat (' + file + ')');
        }
      });
    });
  };

  var includeAllSources = function includeAllSources(cov, opts) {
    if (!opts || !opts.instrumenter || !opts.transformer || !opts.matchFn || !cov) {
      grunt.log.error('includeAllSources was set but coverage wasn\'t run.');
      return;
    }

    var instrumenter = opts.instrumenter,
      transformer = opts.transformer,
      matchFn = opts.matchFn;

    // Source: https://github.com/gotwarlost/istanbul/blob/v0.4.0/lib/command/common/run-with-cover.js
    // Starting at line 220

    // Files that are not touched by code ran by the test runner is manually instrumented, to
    // illustrate the missing coverage.
    matchFn.files.forEach(function eachMatch(file) {
      if (!cov[file]) {
        transformer(fs.readFileSync(file, 'utf-8'), file);

        // When instrumenting the code, istanbul will give each FunctionDeclaration a value of 1 in coverState.s,
        // presumably to compensate for function hoisting. We need to reset this, as the function was not hoisted,
        // as it was never loaded.
        Object.keys(instrumenter.coverState.s).forEach(function eachKey(key) {
          instrumenter.coverState.s[key] = 0;
        });

        cov[file] = instrumenter.coverState;
      }
    });
  };

  var collectReports = function collectReports(opts) {
    var reportFile = path.resolve(reportingDir, options.coverage.reportFile),
      // http://gotwarlost.github.io/istanbul/public/apidocs/classes/Collector.html
      collector = new istanbul.Collector(),
      cov = global[coverageVar];

    if (options.coverage.includeAllSources) {
      includeAllSources(cov, opts);
    }

    // important: there is no event loop at this point
    // everything that happens in this exit handler MUST be synchronous
    grunt.file.mkdir(reportingDir); // yes, do this again since some test runners could clean the dir initially created

    grunt.verbose.writeln('Writing coverage object [' + reportFile + ']');

    fs.writeFileSync(reportFile, JSON.stringify(cov, null, ' '), 'utf8');

    if (options.coverage.collect !== false) {
      options.coverage.collect.forEach(function eachCollect(covPattern) {
        coverageCollect(covPattern, collector);
      });
    }
    else {
      collector.add(cov);
    }

    grunt.verbose.writeln('Writing coverage reports at [' + reportingDir + ']');

    reports.forEach(function eachReport(report) {
      report.writeReport(collector, true);
    });

    coverageThresholdCheck(collector);
  };

  var exitHandler = function exitHandler(opts) {
    if (typeof global[coverageVar] !== 'object' || Object.keys(global[coverageVar]).length === 0) {
      grunt.log.error('No coverage information was collected, exit without writing coverage information');
      return;
    }
    collectReports(opts);
  };

  var istanbulMatcherRun = function istanbulMatcherRun(matchFn) {

    var instrumenter = new istanbul.Instrumenter({coverageVariable: coverageVar});
    var transformer = instrumenter.instrumentSync.bind(instrumenter);
    var hookOpts = {verbose: options.isVerbose};

    istanbul.hook.hookRequire(matchFn, transformer, hookOpts);

    // Hook context to ensure that all requireJS modules get instrumented.
    // Hooking require in isolation does not appear to be sufficient.
    istanbul.hook.hookRunInThisContext(matchFn, transformer, hookOpts);

    // initialize the global variable to stop mocha from complaining about leaks
    global[coverageVar] = {};

    // Return values which will be used later during coverage reporting
    return {
      instrumenter: instrumenter,
      transformer: transformer,
      matchFn: matchFn
    };
  };

  var addReporters = function addReporters(jasmine) {
    jasmine.env.clearReporters();

    var ropts = options.jasmine.reporters;

    var reporter;
    if (ropts.teamcity) {
      reporter = new reporters.TeamCityReporter(); // no options to set
      reporter.name = 'TeamCity Reporter';
      jasmine.addReporter(reporter);
    }
    else if (ropts.spec) {
      reporter = new SpecReporter(ropts.spec);
      reporter.name = 'Spec Reporter';
      jasmine.addReporter(reporter);
    }

    if (ropts.junitXml){
      reporter = new reporters.JUnitXmlReporter(ropts.junitXml);
      jasmine.addReporter(reporter);
    }
  };

  var runner = function runner(opts) {
    opts = opts || {};

    if (options.captureExceptions) {
      // Grunt will kill the process when it handles an uncaughtException, so we need to
      // remove their handler to allow the test suite to continue.
      // A downside of this is that we ignore any other registered `ungaughtException`
      // handlers.
      process.removeAllListeners('uncaughtException');
      process.on('uncaughtException', function onUncaught(e) {
        grunt.log.error('Caught unhandled exception: ', e.toString());
        grunt.log.error(e.stack);
      });
    }
    try {
      var jasmine = new Jasmine();
      jasmine.loadConfig(options.jasmine);
      addReporters(jasmine);
      jasmine.onComplete(function jasmineComplete(passed) {
        options.onComplete(passed, opts);
      });
      jasmine.execute();
    }
    catch (error) {
      grunt.log.error('Jasmine runner failed: ' + error.stack);
      if (options.forceExit) {
        throw error;
      }
      else {
        done(error);
      }
    }
  };

  var doCoverage = function doCoverage() {

    // set up require hooks to instrument files as they are required
    var Report = istanbul.Report;

    grunt.file.mkdir(reportingDir); // ensure we fail early if we cannot do this

    var reportClassNames = options.coverage.report;

    // Add teamcity to the coverage reporter if it was set as jasmine reporter
    if (options.jasmine.reporters.teamcity && reportClassNames.indexOf('teamcity') === -1) {
      reportClassNames = reportClassNames.concat(['teamcity']);
    }

    reportClassNames.forEach(function eachReport(reportClassName) {
      reports.push(Report.create(reportClassName, {
        dir: reportingDir,
        watermarks: options.coverage.watermarks
      }));
    });

    var excludes = options.coverage.excludes || [];
    excludes.push('**/node_modules/**');

    // http://gotwarlost.github.io/istanbul/public/apidocs/classes/Istanbul.html#method_matcherFor
    istanbul.matcherFor({
      root: options.projectRoot,
      includes: fileSrc,
      excludes: excludes
    }, function matcherCallback(err, matchFn) {
      if (err) {
        grunt.fail.warn('istanbul.matcherFor failed.');
        grunt.fail.warn(err);
        return;
      }
      var runnerOpts = istanbulMatcherRun(matchFn);
      runner(runnerOpts);
    });

  };

  grunt.registerMultiTask('jasmine_node', 'Runs jasmine-node with Istanbul code coverage', function registerGrunt() {

    // Default options. Once Grunt does recursive merge, use that, maybe 0.4.6
    options = deepmerge({

      // Used only in this plugin, thus can be refactored out
      projectRoot: process.cwd(), // string
      forceExit: false, // boolean, exit on failure
      captureExceptions: false, // boolean
      isVerbose: false,

      // Jasmine options
      jasmine: {
        spec_dir: 'spec',
        reporters: {
        }
      },

      // Coverage options
      coverage: { // boolean|object
        reportFile: 'coverage.json',
        collect: [ // paths relative to 'reportDir'
          'coverage*.json'
        ], // coverage report file matching patters
        relativize: true,
        thresholds: {
          statements: 0,
          branches: 0,
          lines: 0,
          functions: 0
        },
        includeAllSources: false,
        reportDir: 'coverage',
        excludes: []
      }
    }, this.options());

    // Support old config with Spec reporter only
    if (options.jasmine.reporter) {
      options.jasmine.reporters = {
        spec: options.jasmine.reporter
      };
    }

    options.jasmine.spec_files = options.jasmine.spec_files || ['**/*[sS]pec.js'];
    if (options.coverage !== false) {
      options.coverage.report = options.coverage.report || ['lcov', 'text-summary'];
    }

    fileSrc = this.data.src || fileSrc;

    // Tell grunt this task is asynchronous.
    done = this.async();

    if (typeof options.onComplete !== 'function') {
      options.onComplete = function onComplete(passed, opts) {
        var exitCode = 1;
        grunt.log.writeln('');
        if (passed) {
          exitCode = 0;
          if (options.coverage !== false) {
            exitHandler(opts);
          }
        }

        if (options.forceExit && exitCode === 1) {
          grunt.fail.warn('Test runner failed.', exitCode);
        }
        done(exitCode === 0);
      };
    }

    if (options.coverage !== false) {
      reportingDir = path.resolve(process.cwd(), options.coverage.reportDir);
      doCoverage();
    }
    else {
      runner();
    }
  });
};
