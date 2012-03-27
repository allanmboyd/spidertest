var formatErrors = require("formaterrors");
var Reporter = require("../Reporter");
var util = require("util");

var failTheme = new formatErrors.StackTheme();
failTheme.messageLineHighlights = ["        "];
failTheme.stackHighlights = ["      "];
failTheme.stackHighlightPatterns = ["at"];

var errorTheme = new formatErrors.StackTheme();
errorTheme.messageLineHighlights = ["        "];
errorTheme.stackHighlights = ["      "];
errorTheme.stackHighlightPatterns = ["at"];

// todo consider making these options configurable as implied by the name
var options = {
    "error_prefix": "\u001B[31m",
    "error_suffix": "\u001B[39m",
    "ok_prefix": "\u001B[32m",
    "ok_suffix": "\u001B[39m",
    "bold_prefix": "\u001B[1m",
    "bold_suffix": "\u001B[22m"
};

var error = function (str) {
    return options.error_prefix + str + options.error_suffix;
};
var ok = function (str) {
    return options.ok_prefix + str + options.ok_suffix;
};
var bold = function (str) {
    return options.bold_prefix + str + options.bold_suffix;
};

var ConsoleReporter = new Reporter();
ConsoleReporter.prototype.constructor = ConsoleReporter;

exports.createReporter = function () {
    var reporter = new ConsoleReporter();
    reporter.suitesEnd = suitesEnd;
    reporter.suiteStart = suiteStart;
    reporter.topicStart = topicStart;
    reporter.testSuccess= testSuccess;
    reporter.testFailure = testFailure;
    reporter.testError = testError;

    return reporter;
};

var suitesEnd = function(testCount, successCount, failedCount, errorCount) {

    var summary = "\nTests: " + testCount + ", Passed: " + successCount +
        ", Failed: " + failedCount + ", Errors: " + errorCount;

    if (failedCount === 0 && errorCount === 0) {
        console.log(bold(ok(summary)));
    } else {
        console.log(bold(error(summary)));
    }
};

var suiteStart = function(suiteName, suiteDescription) {
    var output = "\n" + suiteName;
    if (suiteDescription) {
        output += " - " + suiteDescription;
    }
    console.log(bold(output));
};

var topicStart = function(topicName, topicDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
    this.topicTestCount = testCount;
    this.topicSuccessCount = successCount;
    this.topicFailedCount = failedCount;
    this.topicErrorCount = errorCount;
    this.topicTime = suiteTime;

    var output = topicName;
    if (topicDescription) {
        output += " - " + topicDescription;
    }

    if (testCount > 0 && failedCount === 0 && errorCount === 0) {
        console.log(ok(bold('\n✔ ' + output)));
    } else if (errorCount > 0) {
        console.log(error(bold('\n\u274e ' + output)));
    } else if (failedCount > 0) {
        console.log(error(bold('\n✖ ' + output)));
    } else {
        console.log(error(bold('\n? ' + output + " (NO TESTS FOUND)")));
    }
};

var testSuccess = function(testName) {
    console.log('    ✔ ' + testName);
};

var testFailure = function(testName, error, testTime, testFile) {
    failTheme.stackFilters = [testFile];
    var failError = formatErrors.highlightError(error, failTheme);
    console.log('    ✖ ' + testName);
    console.log(failError.stack);
};

var testError = function(testName, error) {
    var formattedError = formatErrors.highlightError(error, errorTheme);
    console.log("    \u274e " + testName + '\n');
    console.log(formattedError.stack);
};
