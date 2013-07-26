module.exports = function (grunt) {
    'use strict';
    var isVerbose;

    var doCoverage = function (opts, projectRoot, runFn) {
        var istanbul = require('istanbul'),
            Path = require('path'),
            mkdirp = require('mkdirp'),
            fs = require('fs'),
            glob = require('glob');

        // set up require hooks to instrument files as they are required
        var DEFAULT_REPORT_FORMAT = 'lcov';
        var Report = istanbul.Report;
        var reports = [];
        var savePath = opts.savePath || 'coverage';
        var reportingDir = Path.resolve(process.cwd(), savePath);
        mkdirp.sync(reportingDir); //ensure we fail early if we cannot do this
        var reportClassNames = opts.report || [DEFAULT_REPORT_FORMAT];
        reportClassNames.forEach(function(reportClassName) {
            reports.push(Report.create(reportClassName, { dir: reportingDir }));
        });
        if (opts.print !== 'none') {
            switch (opts.print) {
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

        var excludes = opts.excludes || [];
        excludes.push('**/node_modules/**');

        istanbul.
            matcherFor({
                root: projectRoot || process.cwd(),
                includes: [ '**/*.js' ],
                excludes: excludes
            },
            function (err, matchFn) {
                if (err) {
                    return callback(err);
                }

                var coverageVar = '$$cov_' + new Date().getTime() + '$$',
                    instrumenter = new istanbul.Instrumenter({ coverageVariable: coverageVar }),
                    transformer = instrumenter.instrumentSync.bind(instrumenter),
                    hookOpts = { verbose: isVerbose };

                istanbul.hook.hookRequire(matchFn, transformer, hookOpts);

                //initialize the global variable to stop mocha from complaining about leaks
                global[coverageVar] = {};

                process.once('exit', function () {
                    var file = Path.resolve(reportingDir, 'coverage.json'),
                        collector,
                        cov;
                    if (typeof global[coverageVar] === 'undefined' || Object.keys(global[coverageVar]).length === 0) {
                        console.error('No coverage information was collected, exit without writing coverage information');
                        return;
                    } else {
                        cov = global[coverageVar];
                    }
                    //important: there is no event loop at this point
                    //everything that happens in this exit handler MUST be synchronous
                    mkdirp.sync(reportingDir); //yes, do this again since some test runners could clean the dir initially created
                    if (opts.print !== 'none') {
                        console.error('=============================================================================');
                        console.error('Writing coverage object [' + file + ']');
                    }
                    fs.writeFileSync(file, JSON.stringify(cov), 'utf8');
                    collector = new istanbul.Collector();
                    if(opts.collect != null) {
                        opts.collect.forEach(function(covPattern) {
                            var coverageFiles = glob.sync(covPattern, null);
                            coverageFiles.forEach(function(coverageFile) {
                                var contents = fs.readFileSync(coverageFile, 'utf8');
                                var fileCov = JSON.parse(contents);
                                if(opts.relativize) {
                                    var cwd = process.cwd();
                                    var newFileCov = {};
                                    for(var key in fileCov) {
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
                        })
                    }
                    else {
                        collector.add(cov);
                    }
                    if (opts.print !== 'none') {
                        console.error('Writing coverage reports at [' + reportingDir + ']');
                        console.error('=============================================================================');
                    }
                    reports.forEach(function (report) {
                        report.writeReport(collector, true);
                    });
                    //return callback();
                });
                runFn();
            });

    };

    grunt.registerTask("jasmine_node", "Runs jasmine-node.", function () {
        var jasmine = require('jasmine-node');
        var util;
        // TODO: ditch this when grunt v0.4 is released
        grunt.util = grunt.util || grunt.utils;
        var _ = grunt.util._;

        try {
            util = require('util');
        } catch (e) {
            util = require('sys');
        }

        var projectRoot = grunt.config("jasmine_node.projectRoot") || ".";
        var specFolders = grunt.config("jasmine_node.specFolders");
        var forceExit = grunt.config("jasmine_node.options.forceExit") || false;
        var match = grunt.config("jasmine_node.options.match") || '.';
        var matchall = grunt.config("jasmine_node.options.matchall") || false;
        var specNameMatcher = grunt.config("jasmine_node.options.specNameMatcher") || 'spec';
        var extensions = grunt.config("jasmine_node.options.extensions") || 'js';
        var useHelpers = grunt.config("jasmine_node.useHelpers") || false;


        var coverage = grunt.config("jasmine_node.coverage") || false;

        isVerbose = grunt.config("jasmine_node.verbose");
        var showColors = grunt.config("jasmine_node.colors");

        // Tell grunt this task is asynchronous.
        var done = this.async();
        var regExpSpec = new RegExp(match + (matchall ? "" : specNameMatcher + "\\.") + "(" + extensions + ")$", 'i');
        var onComplete = function (runner, log) {
            var exitCode;
            util.print('\n');
            if (runner.results().failedCount === 0) {
                exitCode = 0;
            } else {
                exitCode = 1;
            }

            if (forceExit) {
                process.exit(exitCode);
            }
            done(exitCode == 0);
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
                verbose: isVerbose,
                showColors: showColors,
                teamcity: false,
                useRequireJs: false,
                regExpSpec: regExpSpec,
                junitreport: {
                    report: false,
                    savePath: "./reports/",
                    useDotNotation: true,
                    consolidate: true
                }
            };


            _.extend(options, grunt.config("jasmine_node.options") || {});


            // order is preserved in node.js
            var legacyArguments = Object.keys(options).map(function (key) {
                return options[key];
            });

            if (useHelpers) {
                jasmine.loadHelpersInFolder(projectRoot,
                    new RegExp("helpers?\\.(" + extensions + ")$", 'i'));
            }

            try {
                // for jasmine-node@1.0.27 individual arguments need to be passed
                jasmine.executeSpecsInFolder.apply(this, legacyArguments);
            }
            catch (e) {
                try {
                    // since jasmine-node@1.0.28 an options object need to be passed
                    jasmine.executeSpecsInFolder(options);
                } catch (e) {
                    console.log('Failed to execute "jasmine.executeSpecsInFolder": ' + e.stack);
                }
            }
        };

        if (coverage) {
            doCoverage(coverage, projectRoot, runFn);
        }
        else {
            runFn();
        }
    });
};
