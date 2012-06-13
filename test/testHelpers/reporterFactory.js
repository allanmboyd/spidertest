var Reporter = require("../../lib/Reporter");

/**
 * Provide a Reporter that counts the Reporter callback method invocations and makes these counted values available
 * to callers.
 *
 * @return {Reporter} a Reporter that reports to nowhere but provides details on the number of times each Reporter
 * callback method was invoked
 */
exports.createCountingReporter = function() {
    return exports.createSuiteStoreReporter();
};

/**
 * Provide a Reporter that counts the Reporter callback method invocations and makes these counted values available
 * to callers. And builds up a Suites object containing all suites, their topics and test results and makes this
 * available to callers.
 *
 * @return {Reporter} a Reporter that reports to nowhere but provides details on the number of times each Reporter
 * callback method was invoked as well as a suites object.
 */
exports.createSuiteStoreReporter = function() {
    var reporter = Reporter.createReporter();
    reporter.suitesStartCount = 0;
    reporter.suiteStartCount = 0;
    reporter.topicStartCount = 0;
    reporter.testStartCount = 0;
    reporter.successCount = 0;
    reporter.failedCount = 0;
    reporter.errorCount = 0;
    reporter.testEndCount = 0;
    reporter.topicEndCount = 0;
    reporter.suiteEndCount = 0;
    reporter.suitesEndCount = 0;
    reporter.suites = {};

    var currentSuite;
    var currentTopic;

    reporter.suitesStart = function() {
        this.suitesStartCount += 1;
    };
    reporter.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
        this.suiteStartCount += 1;
        currentSuite = {
            name: suiteName,
            description: suiteDescription,
            testCount: testCount,
            successCount: successCount,
            failedCount: failedCount,
            errorCount: errorCount,
            suiteTime: suiteTime,
            topics: {}
        };
        reporter.suites[suiteName] = currentSuite;
    };
    reporter.topicStart = function(topicName, topicDescription, testCount, successCount, failedCount, errorCount, topicTime) {
        this.topicStartCount += 1;
        currentTopic = {
            name: topicName,
            description: topicDescription,
            testCount: testCount,
            successCount: successCount,
            failedCount: failedCount,
            errorCount: errorCount,
            topicTime: topicTime,
            tests: {},
            passed: {},
            failed: {},
            errors: {}

        };
        currentSuite.topics[topicName] = currentTopic;
    };
    reporter.testStart = function(testName, testTime, testFile) {
        this.testStartCount += 1;
        currentTopic.tests[testName] = {
            name: testName,
            testTime: testTime,
            testFile: testFile
        }
    };
    reporter.testSuccess = function(testName, testTime, testFile) {
        this.successCount += 1;
        currentTopic.passed[testName] = {
            name: testName,
            testTime: testTime,
            testFile: testFile
        }
    };
    reporter.testFailure = function(testName, error, testTime, testFile) {
        this.failedCount += 1;
        currentTopic.failed[testName] = {
            name: testName,
            error: error,
            testTime: testTime,
            testFile: testFile
        }
    };
    reporter.testError = function(testName, error, testTime, testFile) {
        this.errorCount += 1;
        currentTopic.errors[testName] = {
            name: testName,
            error: error,
            testTime: testTime,
            testFile: testFile
        }
    };
    reporter.testEnd = function() {
        this.testEndCount += 1;
    };
    reporter.topicEnd = function() {
        this.topicEndCount += 1;
    };
    reporter.suiteEnd = function() {
        this.suiteEndCount += 1;
    };
    reporter.suitesEnd = function() {
        this.suitesEndCount += 1;
    };

    return reporter;
};