module.exports = function (grunt) {
  'use strict';
  var isVerbose;

  var istanbul = require('istanbul'),
    Path = require('path'),
    fs = require('fs');

  var reportingDir = Path.resolve(process.cwd(), 'coverage'),
    coverageVar = '$$cov_' + new Date().getTime() + '$$',
    coverageOpts,
    reports = [];

  var exitHandler = function () {
    var file = Path.resolve(reportingDir, 'coverage.json'),
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
              var path = item.path;
              var relPath = Path.relative(cwd, path);
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
      hookOpts = {verbose: isVerbose};

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

    reportingDir = Path.resolve(process.cwd(), savePath);
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

  grunt.registerTask('jasmine_node', 'Runs jasmine-node.', function () {

    var jasmine = require('jasmine-node');
    var _ = grunt.util._;

    var self = this;

    var projectRoot = grunt.config(this.name + '.projectRoot') || '.';
    var specFolders = grunt.config(this.name + '.specFolders');
    var forceExit = grunt.config(this.name + '.options.forceExit') || false;
    var match = grunt.config(this.name + '.options.match') || '.';
    var matchall = grunt.config(this.name + '.options.matchall') || false;
    var specNameMatcher = grunt.config(this.name + '.options.specNameMatcher') || 'spec';
    var extensions = grunt.config(this.name + '.options.extensions') || 'js';
    var useHelpers = grunt.config(this.name + '.useHelpers') || false;
    var report = grunt.config(this.name + '.options.jUnit.report') || false;
    var savePath = grunt.config(this.name + '.options.jUnit.savePath') || './reports/';
    var captureExceptions = grunt.config(this.name + '.options.captureExceptions') || false;

    coverageOpts = grunt.config(this.name + '.coverage') || false;

    isVerbose = grunt.config(this.name + '.verbose');
    var showColors = grunt.config(this.name + '.colors');

    // Tell grunt this task is asynchronous.
    var done = this.async();
    var regExpSpec = new RegExp(match + (matchall ? '' : specNameMatcher + '\\.') + '(' + extensions + ')$', 'i');
    var onComplete = function (runner, log) {
      var exitCode;
      grunt.log.write('\n');
      if (runner.results().failedCount === 0) {
        exitCode = 0;
      }
      else {
        exitCode = 1;
      }

      if (forceExit) {
        process.exit(exitCode);
      }
      done(exitCode === 0);
    };

    var runFn = function () {

      if (specFolders == null) {
        specFolders = [projectRoot];
      }

      if (_.isUndefined(isVerbose)) {
        isVerbose = true;
      }

      if (_.isUndefined(showColors)) {
        showColors = true;
      }

      var options = {
        specFolders: specFolders,
        onComplete: onComplete,
        isVerbose: isVerbose,
        showColors: showColors,
        teamcity: false,
        useRequireJs: false,
        regExpSpec: regExpSpec,
        junitreport: {
          report: report,
          savePath: savePath,
          useDotNotation: true,
          consolidate: true
        }
      };

      _.extend(options, grunt.config(self.name + '.options') || {});

      if (captureExceptions) {
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

      // order is preserved in node.js
      var legacyArguments = Object.keys(options).map(function (key) {
        return options[key];
      });

      if (useHelpers) {
        jasmine.loadHelpersInFolder(projectRoot,
          new RegExp('helpers?\\.(' + extensions + ')$', 'i'));
      }

      try {
        // for jasmine-node@1.0.27 individual arguments need to be passed
        jasmine.executeSpecsInFolder.apply(this, legacyArguments);
      }
      catch (e) {
        try {
          // since jasmine-node@1.0.28 an options object need to be passed
          jasmine.executeSpecsInFolder(options);
        }
        catch (e) {
          if (forceExit) {
            process.exit(1);
          }
          else {
            done(1);
          }
          console.log('Failed to execute "jasmine.executeSpecsInFolder": ' + e.stack);
        }
      }
    };

    if (coverageOpts) {
      doCoverage(projectRoot, runFn);
    }
    else {
      runFn();
    }
  });
};
