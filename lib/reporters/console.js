var exceptions = require("exceptions");
var formatErrors = require("formaterrors");
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
    "bold_suffix": "\u001B[22m",
    "assertion_prefix": "\u001B[35m",
    "assertion_suffix": "\u001B[39m"
};

exports.report = function(suites, Result) {

    var error = function (str) {
        return options.error_prefix + str + options.error_suffix;
    };
    var ok = function (str) {
        return options.ok_prefix + str + options.ok_suffix;
    };
    var bold = function (str) {
        return options.bold_prefix + str + options.bold_suffix;
    };
    var assertionMessage = function (str) {
        return options.assertion_prefix + str + options.assertion_suffix;
    };

    var totalTests = 0;
    var totalSuccess = 0;
    var totalFailed = 0;
    var totalErrors = 0;

    for (var suiteName in suites) {
        if (suites.hasOwnProperty(suiteName)) {
            var suite = suites[suiteName];
            var output = "\n" + suite.getName();
            if (suite.getDescription()) {
                output += " - " + suite.getDescription();
            }
            console.log(bold(output));
            var topics = suite.getTopics();
            for (var topicName in topics) {
                if (topics.hasOwnProperty(topicName)) {
                    var topic = topics[topicName];
                    output = topic.getName();
                    if (topic.getDescription()) {
                        output += " - " + topic.getDescription();
                    }
                    if (topic.getResult() === Result.PASS) {
                        console.log(ok(bold('✔ ' + output)));
                    }
                    if (topic.getResult() === Result.FAIL) {
                        console.log(error(bold('✖ ' + output)));
                    }
                    if (topic.getResult() === Result.ERROR) {
                        console.log(error(bold('\u274e ' + output)));
                    }
                    if (topic.getResult() === Result.NO_TESTS) {
                        console.log(error(bold('? ' + output + " (NO TESTS FOUND)")));
                    }

                    var testResults = topic.getTestResults();
                    for (var i = 0; i < testResults.length; i += 1) {
                        var testResult = testResults[i];
                        if (testResult.getResult() === Result.PASS) {
                            console.log('    ✔ ' + testResult.getName());
                        } else if (testResult.getResult() === Result.FAIL) {
                            failTheme.stackFilters = [testResult.getTestFile()];
                            var failError = formatErrors.highlightError(testResult.getError(), failTheme);
                            console.log('    ✖ ' + testResult.getName());
                            console.log(failError.stack);
//                        console.log(ae.stack + '\n');
                        } else if (testResult.getResult() === Result.ERROR) {
                            var formattedError = formatErrors.highlightError(testResult.getError(), errorTheme);
                            console.log("    \u274e " + testResult.getName() + '\n');
                            console.log(formattedError.stack);
                        } else {
                            exceptions.ILLEGAL_STATE.thro("Unknown test result: " + testResult);
                        }
                        var detail = testResults[i].getName() + ": " + testResults[i].getResult();
                        if (testResults[i].getError() !== null) {
                            detail += " - " + testResults[i].getError();
                        }
                    }
                }
            }

            totalTests += suite.getTestCount();
            totalSuccess += suite.getSuccessCount();
            totalFailed += suite.getFailedCount();
            totalErrors += suite.getErrorCount();
        }
    }


    var summary = "\nTests: " + totalTests + ", Passed: " + totalSuccess +
        ", Failed: " + totalFailed + ", Errors: " + totalErrors;

    if (totalFailed === 0 && totalErrors === 0) {
        console.log(bold(ok(summary)));
    } else {
        console.log(bold(error(summary)));
    }
}