/**
 * The purpose of suiteManager is to maintain suites of tests and in particular that means allowing tests to be
 * executed, storing their results locally and independent of any reporting mechanism and allowing the test results
 * to be sent to one or more Reporters as required.
 *
 * The suiteManager contains a collection of test suites. Each suite contains one or more topics. Each topic contains
 * one or more tests.
 */
var exceptions = require("exceptions");
var und = require("underscore");
var util = require("util");

var totalFailed = 0;

var suites = {};

var ResultType = {
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
    var topicTime = 0;
    var result = ResultType.NO_TESTS;
    o.getResult = function () {
        if (errorCount > 0) {
            result = ResultType.ERROR;
        } else if (failedCount > 0) {
            result = ResultType.FAIL;
        } else if (successCount > 0) {
            result = ResultType.PASS;
        }
        return result;
    };

    o.addTestResult = function (testResult) {
        switch (testResult.getResult()) {
            case ResultType.PASS:
                successCount += 1;
                break;
            case ResultType.FAIL:
                failedCount += 1;
                totalFailed += 1;
                break;
            case ResultType.ERROR:
                errorCount += 1;
                totalFailed += 1;
                break;
            default:
                exceptions.ILLEGAL_ARGUMENT.thro("Unexpected test result: " + testResult);
        }
        topicTime += testResult.getTestTime();
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

    o.getTopicTime = function () {
        return topicTime;
    };

    return o;
};

var createSuite = function (name, description) {
    var o = new Suite();
    var topics = {};

    function topicCountTotal(countFunction) {
        var count = 0;
        for (var topic in topics) {
            if (topics.hasOwnProperty(topic)) {
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

    o.getSuiteTime = function() {
        return topicCountTotal("getTopicTime");
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

var createTestResult = function (name, result, error, testFile, testTime) {

    if (result === ResultType.PASS && error) {
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

    o.getTestFile = function () {
        return testFile;
    };

    o.getTestTime = function () {
        return testTime || 0;
    };

    return o;
};

var createNewSuite = function(name, description) {
    var suite = createSuite(name, description);
    suites[name] = suite;
    return suite;
};

var runSuiteTest = function (testDetails) {
    var success = false;
    var suite = suites[testDetails.suiteName];
    if (!suite) {
        suite = createNewSuite(testDetails.suiteName);
    }
    var topic = suite.getTopic(testDetails.topicName);
    if (!topic) {
        topic = createTopic(testDetails.topicName);
        suite.addTopic(topic);
    }
    var start = new Date();
    var testTime;
    try {
        var assertion = testDetails.test.assert;
        if(!assertion) {
            throw new Error("Test does not have an assert function: " + util.inspect(testDetails.test));
        }
        if(!und.isFunction(assertion)) {
            throw new Error("Test assert attribute is not a function: " + util.inspect(testDetails.test));
        }
        success = assertion(testDetails.spiderPayload, testDetails.$, testDetails.pathVariables);
        testTime = (new Date().getTime() - start.getTime()) / 1000;
        topic.addTestResult(createTestResult(testDetails.testName, ResultType.PASS, null, testDetails.testFile, testTime));
    } catch (error) {
        testTime = (new Date().getTime() - start.getTime()) / 1000;
        if (error.name === "AssertionError") {
            topic.addTestResult(createTestResult(testDetails.testName, ResultType.FAIL, error,
                testDetails.testFile, testTime));
        } else {
            topic.addTestResult(createTestResult(testDetails.testName, ResultType.ERROR, error,
                testDetails.testFile, testTime));
        }
    }
};

exports.runSuiteTest = runSuiteTest;

exports.generateReport = function (reporter) {
    reporter = reporter || require("./reporters/ConsoleReporter").createReporter();
    walkSuites(reporter);
};

exports.clean = function() {
    suites = {};
};

function walkSuites(reporters) {

    if (!reporters.forEach) {
        reporters = [reporters];
    }

    reporters.forEach(function(reporter) {
        reporter.suitesStart();
    });

    var totalTests = 0;
    var totalSuccess = 0;
    var totalFailed = 0;
    var totalErrors = 0;
    var totalTime = 0;

    for (var suiteName in suites) {
        if (suites.hasOwnProperty(suiteName)) {
            var suite = suites[suiteName];

            reporters.forEach(function(reporter) {
                reporter.suiteStart(suiteName, suite.getDescription(), suite.getTestCount(), suite.getSuccessCount(),
                    suite.getFailedCount(), suite.getErrorCount(), suite.getSuiteTime());
            });

            var topics = suite.getTopics();
            for (var topicName in topics) {
                if (topics.hasOwnProperty(topicName)) {
                    var topic = topics[topicName];
                    reporters.forEach(function(reporter) {
                        reporter.topicStart(topicName, topic.getDescription(), topic.getTestCount(),
                            topic.getSuccessCount(), topic.getFailedCount(), topic.getErrorCount(), topic.getTopicTime());
                    });
                    var testResults = topic.getTestResults();
                    for (var i = 0; i < testResults.length; i += 1) {
                        var testResult = testResults[i];
                        reporters.forEach(function(reporter) {
                            reporter.testStart(testResult.getName(), testResult.getTestTime(),
                                testResult.getTestFile());
                        });
                        if (testResult.getResult() === ResultType.PASS) {
                            reporters.forEach(function(reporter) {
                                reporter.testSuccess(testResult.getName(), testResult.getTestTime(),
                                    testResult.getTestFile());
                            });
                        } else if (testResult.getResult() === ResultType.FAIL) {
                            reporters.forEach(function(reporter) {
                                reporter.testFailure(testResult.getName(), testResult.getError(), testResult.getTestTime(),
                                    testResult.getTestFile());
                            });
                        } else if (testResult.getResult() === ResultType.ERROR) {
                            reporters.forEach(function(reporter) {
                                reporter.testError(testResult.getName(), testResult.getError(), testResult.getTestTime(),
                                    testResult.getTestFile());
                            });
                        } else {
                            exceptions.ILLEGAL_STATE.thro("Unknown test result: " + testResult);
                        }
                        reporters.forEach(function(reporter) {
                            reporter.testEnd();
                        });
                    }
                    reporters.forEach(function(reporter) {
                        reporter.topicEnd();
                    });
                }
            }
            reporters.forEach(function(reporter) {
                reporter.suiteEnd();
            });
            totalTests += suite.getTestCount();
            totalSuccess += suite.getSuccessCount();
            totalFailed += suite.getFailedCount();
            totalErrors += suite.getErrorCount();
            totalTime += suite.getSuiteTime();
        }
    }

    reporters.forEach(function(reporter) {
        reporter.suitesEnd(totalTests, totalSuccess, totalFailed, totalErrors, totalTime);
    });
}