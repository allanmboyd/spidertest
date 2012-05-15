#!/usr/bin/env node --max-stack-size=10000000

var config = require("nconf");
var spiderTest = require("../lib/spiderTest");
var optimist = require("optimist");
var options = require("./options").options;
var util = require("util");

initializeOptimist();

var argv = optimist.argv;

if (argv.h || argv.help) {
    optimist.showHelp();
    process.exit(0);
}

config.argv().env();

if (argv.config) {
    config.file({file: argv.config});
}

initializeConfigDefaults();

var spiderStartUrl = config.get("spiderStartUrl");
var testDir = config.get("testDir");

var reporters = initialiseReporters(config.get("reporters"), config.get("reporterOptions"));

if (!spiderStartUrl || !testDir) {
    optimist.showHelp();
    process.exit(-1);
} else {
    spiderTest.runTests(spiderStartUrl, testDir, null, null, reporters, config);
}


function initializeOptimist() {
    importOptionsIntoOptimist();
    optimist.wrap(79).usage("Usage: spiderTest [configOption] (see spiderTest -h for more detail)");
}

function initialiseReporters(reportersArgv, reporterOptions) {
    var reporterPaths = reportersArgv.split(",");
    var reporters = [];
    reporterPaths.forEach(function(reporterPath) {
        var reporter = require(reporterPath.trim());
        reporters.push(reporter.createReporter(reporterOptions));
    });

    return reporters;
}

function importOptionsIntoOptimist() {
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            for (var optionAttribute in options[option]) {
                if (options[option].hasOwnProperty(optionAttribute)) {
                    optimist[optionAttribute](option, options[option][optionAttribute]);
                }
            }
        }
    }
}

function initializeConfigDefaults() {
    var defaults = (function () {
        var d = {};
        for (var option in options) {
            if (options.hasOwnProperty(option) && options[option]["default"]) {
                d[option] = options[option]["default"];
            }
        }

        return d;
    }());

    config.defaults(defaults);
}