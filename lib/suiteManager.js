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

var createTestResult = function (name, result, error, testFile) {

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

    o.getTestFile = function () {
        return testFile;
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
    try {
        success = testDetails.test(testDetails.spiderPayload, testDetails.$);
        topic.addTestResult(createTestResult(testDetails.testName, Result.PASS, null, testDetails.testFile));
    } catch (error) {
        console.log("Caught error: " + error.name);
        if (error.name === "AssertionError") {
            topic.addTestResult(createTestResult(testDetails.testName, Result.FAIL, error, testDetails.testFile));
        } else {
            topic.addTestResult(createTestResult(testDetails.testName, Result.ERROR, error, testDetails.testFile));
        }
    }
};

exports.runSuiteTest = runSuiteTest;

exports.generateReport = function (reporter) {
    reporter = reporter || "console";
    if (reporter.indexOf("/") === -1) {
        reporter = "./reporters/" + reporter;
    }
    reporter = require(reporter);
    reporter.report(suites, Result);
};


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
