module.exports = function (grunt) {
  'use strict';

  var istanbul = require('istanbul'),
    jasmine = require('jasmine-node'),
    path = require('path'),
    fs = require('fs');

  var reportingDir = path.resolve(process.cwd(), 'coverage'),
    coverageVar = '$$cov_' + new Date().getTime() + '$$',
    options,
    coverageOpts,
    reports = [];

  var exitHandler = function () {
    var file = path.resolve(reportingDir, 'coverage.json'),
      collector,
      cov;

    if (typeof global[coverageVar] === 'undefined' || Object.keys(global[coverageVar]).length === 0) {
      console.error('No coverage information was collected, exit without writing coverage information');
      return;
    }
    else {
      cov = global[coverageVar];
    }

    //important: there is no event loop at this point
    //everything that happens in this exit handler MUST be synchronous
    grunt.file.mkdir(reportingDir); //yes, do this again since some test runners could clean the dir initially created
    if (coverageOpts.print !== 'none') {
      console.error('=============================================================================');
      console.error('Writing coverage object [' + file + ']');
    }
    fs.writeFileSync(file, JSON.stringify(cov), 'utf8');
    collector = new istanbul.Collector();

    if (coverageOpts.collect != null) {
      coverageOpts.collect.forEach(function (covPattern) {

        var coverageFiles = grunt.file.expand(covPattern);
        coverageFiles.forEach(function (coverageFile) {
          var contents = fs.readFileSync(coverageFile, 'utf8');
          var fileCov = JSON.parse(contents);
          if (coverageOpts.relativize) {
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
      });
    }
    else {
      collector.add(cov);
    }

    if (coverageOpts.print !== 'none') {
      console.error('Writing coverage reports at [' + reportingDir + ']');
      console.error('=============================================================================');
    }

    reports.forEach(function (report) {
      report.writeReport(collector, true);
    });

    // Check against thresholds
    collector.files().forEach(function (file) {
      var summary = istanbul.utils.summarizeFileCoverage(
        collector.fileCoverageFor(file));
      grunt.util._.each(coverageOpts.thresholds, function (threshold, metric) {
        var actual = summary[metric];
        if (!actual) {
          grunt.warn('unrecognized metric: ' + metric);
        }
        if (actual.pct < threshold) {
          grunt.warn('expected ' + metric + ' coverage to be at least ' + threshold + '% but was ' + actual.pct + '%' + '\n\tat (' + file + ')');
        }
      });
    });

  };

  var istanbulMatcherRun = function (matchFn) {

    var instrumenter = new istanbul.Instrumenter({coverageVariable: coverageVar}),
      transformer = instrumenter.instrumentSync.bind(instrumenter),
      hookOpts = {verbose: options.verbose};

    istanbul.hook.hookRequire(matchFn, transformer, hookOpts);

    //initialize the global variable to stop mocha from complaining about leaks
    global[coverageVar] = {};

    process.once('exit', exitHandler);
  };

  var doCoverage = function (projectRoot, runFn) {

    // set up require hooks to instrument files as they are required
    var DEFAULT_REPORT_FORMAT = 'lcov';
    var Report = istanbul.Report;
    var savePath = coverageOpts.savePath || 'coverage';

    reportingDir = path.resolve(process.cwd(), savePath);
    grunt.file.mkdir(reportingDir); //ensure we fail early if we cannot do this
    var reportClassNames = coverageOpts.report || [DEFAULT_REPORT_FORMAT];
    reportClassNames.forEach(function (reportClassName) {
      reports.push(Report.create(reportClassName, {dir: reportingDir}));
    });

    if (coverageOpts.print !== 'none') {
      switch (coverageOpts.print) {
        case 'detail':
          reports.push(Report.create('text'));
          break;
        case 'both':
          reports.push(Report.create('text'));
          reports.push(Report.create('text-summary'));
          break;
        default:
          reports.push(Report.create('text-summary'));
          break;
      }
    }

    var excludes = coverageOpts.excludes || [];
    excludes.push('**/node_modules/**');

    istanbul.matcherFor({
      root: projectRoot || process.cwd(),
      includes: ['**/*.js'],
      excludes: excludes
    }, function (err, matchFn) {
      if (err) {
        grunt.warn(err);
        return;
      }
      istanbulMatcherRun(matchFn);
      runFn();
    });

  };

  grunt.registerMultiTask('jasmine_node', 'Runs jasmine-node.', function () {

    var _ = grunt.util._;

    var self = this;

    var defaultOptions = {
    };

    // Default options
    options = this.options({

      // Originally directly in config root
      projectRoot: '.', // string
      specFolders: null, // array, not used
      useHelpers: false, // boolean
      coverage: false, // boolean|object, needed globally in plugin
      colors: false, // boolean, also 'showColors' used, which is correct?
      verbose: true, // boolean, also 'isVerbose' used, which is correct?

      // Originally under 'options'
      forceExit: false, // boolean, exit on failure
      match: '.', // string, used in the beginning of regular expression
      matchall: false, // boolean, if false, the specNameMatcher is used, true will just be ''
      specNameMatcher: 'spec', // string, filename expression
      extensions: 'js', // string, used in regular expressions after dot, inside (), thus | could be used
      captureExceptions: false, // boolean
      junitreport: {
        report: false,
        savePath: './reports/',
        useDotNotation: true,
        consolidate: true
      },

      // Passed to jasmine
      teamcity: false, // boolean
      useRequireJs: false, // boolean
    });
    coverageOpts = options.coverage;



    // Tell grunt this task is asynchronous.
    var done = this.async();
    options.regExpSpec = new RegExp(options.match + (options.matchall ? '' : options.specNameMatcher + '\\.') + '(' + options.extensions + ')$', 'i');
    options.onComplete = function (runner, log) {
      var exitCode;
      grunt.log.write('\n');
      if (runner.results().failedCount === 0) {
        exitCode = 0;
      }
      else {
        exitCode = 1;
      }

      if (options.forceExit) {
        process.exit(exitCode);
      }
      done(exitCode === 0);
    };

    var runFn = function () {

      if (options.specFolders == null) {
        options.specFolders = [options.projectRoot];
      }

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
        // since jasmine-node@1.0.28 an options object need to be passed
        jasmine.executeSpecsInFolder(options);
      }
      catch (e) {
        if (options.forceExit) {
          process.exit(1);
        }
        else {
          done(1);
        }
        console.log('Failed to execute "jasmine.executeSpecsInFolder": ' + e.stack);
      }

    };

    if (coverageOpts) {
      doCoverage(options.projectRoot, runFn);
    }
    else {
      runFn();
    }
  });
};
