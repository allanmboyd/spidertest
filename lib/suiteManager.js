var exceptions = require("exceptions");
var util = require("util");

var totalFailed = 0;

var suites = {};

var Result = {
    PASS : "successful",
    FAIL : "failed",
    NO_TESTS: "noTests",
    ERROR : "error"
};

var Suite = function () {
};

var Topic = function () {
};

var createTopic = function (name, description) {
    var o = new Topic();
    var testResults = [];
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;
    var result = Result.NO_TESTS;
    o.getResult = function () {
        if (errorCount > 0) {
            result = Result.ERROR;
        } else if (failedCount > 0) {
            result = Result.FAIL;
        } else if (successCount > 0) {
            result = Result.PASS;
        }
        return result;
    };

    o.addTestResult = function (testResult) {
        switch (testResult.getResult()) {
            case Result.PASS:
                successCount += 1;
                break;
            case Result.FAIL:
                failedCount += 1;
                totalFailed += 1;
                break;
            case Result.ERROR:
                errorCount += 1;
                totalFailed += 1;
                break;
            default:
                exceptions.ILLEGAL_ARGUMENT.thro("Unexpected test result: " + testResult);
        }
        testResults.push(testResult);
    };

    o.getTestResults = function () {
        return testResults;
    };

    o.getName = function () {
        return name;
    };

    o.getDescription = function () {
        return description;
    };

    o.getTestCount = function () {
        return testResults.length;
    };

    o.getSuccessCount = function () {
        return successCount;
    };

    o.getFailedCount = function () {
        return failedCount;
    };

    o.getErrorCount = function () {
        return errorCount;
    };

    return o;
};

var createSuite = function (name, description) {
    var o = new Suite();
    var topics = {};

    function topicCountTotal(countFunction) {
        var count = 0;
        for(var topic in topics) {
            if(topics.hasOwnProperty(topic)) {
                count += topics[topic][countFunction]();
            }
        }

        return count;
    }

    o.getName = function () {
        return name;
    };

    o.getDescription = function () {
        return description;
    };

    o.getTestCount = function () {
        return topicCountTotal("getTestCount");

    };

    o.getSuccessCount = function () {
        return topicCountTotal("getSuccessCount");
    };

    o.getFailedCount = function () {
        return topicCountTotal("getFailedCount");
    };

    o.getErrorCount = function () {
        return topicCountTotal("getErrorCount");
    };

    o.getTopics = function () {
        return topics;
    };

    o.getTopic = function (topicName) {
        return topics[topicName];
    };

    o.addTopic = function (topic) {
        topics[topic.getName()] = topic;
    };

    return o;
};

var TestResult = function () {
};

var createTestResult = function (name, result, error) {

    if (result === Result.PASS && error) {
        exceptions.ILLEGAL_ARGUMENT.thro("There should be no error when the test result is a PASS");
    }

    var o = new TestResult();

    o.getName = function () {
        return name;
    };

    o.getResult = function () {
        return result;
    };

    o.getError = function () {
        return error;
    };

    return o;
};

var createNewSuite = function(name, description) {
    var suite = createSuite(name, description);
    suites[name] = suite;
    return suite;
};

var runSuiteTest = function (testName, topicName, suiteName, test) {
    var success = false;
    var suite = suites[suiteName];
    if (!suite) {
        suite = createNewSuite(suiteName);
    }
    var topic = suite.getTopic(topicName);
    if (!topic) {
        topic = createTopic(topicName);
        suite.addTopic(topic);
    }
    try {
        success = test();
        topic.addTestResult(createTestResult(testName, Result.PASS));
    } catch (error) {
        if (error.name === "AssertionError") {
            topic.addTestResult(createTestResult(testName, Result.FAIL, error));
        } else {
            topic.addTestResult(createTestResult(testName, Result.ERROR, error));
        }
    }
};

exports.Suite = Suite;
exports.Result = Result;
exports.createTestResult = createTestResult;
exports.createSuite = createSuite;
exports.runSuiteTest = runSuiteTest;


exports.generateReport = function (reporter) {
    switch (reporter) {
        case "junit":
            generateJunitReport();
            break;
        case "console":
            generateDefaultReport();
            break;
        default:
            generateDefaultReport();
    }

    return totalFailed;
};

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

function generateDefaultReport() {

    var error = function (str) {
        return options.error_prefix + str + options.error_suffix;
    };
    var ok = function (str) {
        return options.ok_prefix + str + options.ok_suffix;
    };
    var bold = function (str) {
        return options.bold_prefix + str + options.bold_suffix;
    };
    var assertion_message = function (str) {
        return options.assertion_prefix + str + options.assertion_suffix;
    };

    var totalTests = 0;
    var totalSuccess = 0;
    var totalFailed = 0;
    var totalErrors = 0;

    for (var suiteName in suites) {
        if (suites.hasOwnProperty(suiteName)) {
            var suite = suites[suiteName];
            var output = suite.getName();
            if (suite.getDescription()) {
                output += " - " + suite.getDescription();
            }
            console.log(bold(output));
            var topics = suite.getTopics();
            for (var topicName in topics) {
                if (topics.hasOwnProperty(topicName)) {
                    var topic = topics[topicName];
                    output = suite.getName();
                    if (suite.getDescription()) {
                        output += " - " + suite.getDescription();
                    }
                    if (topic.getResult() === Result.PASS) {
                        console.log(ok(bold('✔ ' + output)));
                    }
                    if (topic.getResult() === Result.FAIL) {
                        console.log(ok(bold('✖ ' + output)));
                    }
                    if (topic.getResult() === Result.ERROR) {
                        console.log(ok(bold('\u274e ' + output)));
                    }
                    if (topic.getResult() === Result.NO_TESTS) {
                        console.log(ok(bold('? ' + output + " (NO TESTS FOUND)")));
                    }

                    var testResults = topic.getTestResults();
                    for (var i = 0; i < testResults.length; i += 1) {
                        var testResult = testResults[i];
                        if (testResult.getResult() === Result.PASS) {
                            console.log(ok('    ✔ ' + testResult.getName()));
                        }
                        if (testResult.getResult() === Result.FAIL) {
                            var ae = formatAssertionError(testResult.getError());
                            console.log(error('    ✖ ' + testResult.getName() + ": " + assertion_message(ae.message)));
//                        console.log(ae.stack + '\n');
                        }
                        if (testResult.getResult() === Result.ERROR) {
                            console.log(error("    \u274e " + testResult.getName()) + '\n');
                            console.log(testResult.getError());
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


    var summary = "Tests: " + totalTests + ", Passed: " + totalSuccess +
        ", Failed: " + totalFailed + ", Errors: " + totalErrors;

    if (totalFailed === 0 && totalErrors === 0) {
        console.log(bold(ok(summary)));
    } else {
        console.log(bold(error(summary)));
    }
}

function generateJunitReport() {

}

function formatAssertionError(e) {

    if (e.actual && e.expected) {
        var actual = util.inspect(e.actual, false, 10).replace(/\n$/, '');
        var expected = util.inspect(e.expected, false, 10).replace(/\n$/, '');

        var multiline = (
            (actual && actual.indexOf('\n') !== -1) ||
                (expected && expected.indexOf('\n') !== -1)
            );
        var spacing = (multiline ? '\n' : ' ');

        e._message = e.message;
        e.message = "expected" + spacing + expected + spacing + "got" + spacing + actual +
            spacing + "(" + e.operator + ")";

        e.stack = (
            e.name + ':' + spacing +
                actual + spacing + e.operator + spacing +
                expected + '\n' +
                e.stack.split('\n').slice(1).join('\n')
            );
    }

    return e;
}
