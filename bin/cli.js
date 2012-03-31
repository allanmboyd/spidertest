//#!/usr/bin/env node

var config = require("nconf");
var spiderTest = require("../lib/spiderTest");
var optimist = require("optimist");
var options = require("./options").options;
var util = require("util");

initializeOptimist();

var argv = optimist.argv;

if(argv.h || argv.help) {
    optimist.showHelp();
    process.exit(0);
}

config.argv().env();

if(argv.config){
    config.file({file: argv.config});
}

initializeConfigDefaults();

console.log(config.get("reporters"));

function initializeOptimist() {
    importOptionsIntoOptimist();
    optimist.wrap(79).usage("Usage: spiderTest [configOption] (see spiderTest -h for more detail)");
}

function initialiseReporters(reportersArgv) {
    var reporterPaths = reportersArgv.split(",");
    var reporters = [];
    reporterPaths.forEach(function(reporterPath) {
        var reporter = require(reporterPath.trim());
        reporters.push(reporter);
    });

    return reporterPaths;
}

function importOptionsIntoOptimist() {
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            for(var optionAttribute in options[option]) {
                if(options[option].hasOwnProperty(optionAttribute)) {
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
            if(options.hasOwnProperty(option) && options[option]["default"]) {
                d[option] = options[option]["default"];
            }
        }

        return d;
    }());

    config.defaults(defaults);
}