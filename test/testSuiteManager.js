var reporterFactory = require('./testHelpers/reporterFactory');
var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");

var suiteManagerModule = loadModule("./lib/suiteManager.js");
var SuiteManager = require('../lib/suiteManager.js'); //suiteManagerModule.module.exports;

var Suite = suiteManagerModule.Suite;
var ResultType = suiteManagerModule.ResultType;

exports.testCreateTestResult = function (test) {
    var testResult = suiteManagerModule.createTestResult("testName", ResultType.PASS);
    should.exist(testResult);
    should.equal("testName", testResult.getName());
    should.equal(ResultType.PASS, testResult.getResult());
    test.done();
};

exports.testCreateSuite = function (test) {
    var suite = suiteManagerModule.createSuite("suitename");
    should.exist(suite);
    should.ok(suite instanceof Suite);
    should.equal("suitename", suite.getName());
    suite = suiteManagerModule.createSuite("suitename", "description");
    should.exist(suite);
    should.equal("suitename", suite.getName());
    should.equal("description", suite.getDescription());
    should.equal(0, suite.getTestCount());
    should.equal(0, suite.getFailedCount());
    should.equal(0, suite.getSuccessCount());
    should.equal(0, suite.getErrorCount());
    test.done();
};

exports.testRunSuiteTest = function (test) {

    var test1 = function () {
    };

    var testDetails = {
        testName: "Test1",
        topicName: "Topic1",
        suiteName: "Suite1",
        test: {
            assert: test1
        }
    };
    var suiteManager = SuiteManager.createSuiteManager();
    suiteManager.runSuiteTest(testDetails);
    var reporter = reporterFactory.createSuiteStoreReporter();
    suiteManager.generateReport(reporter);
    
    var suites = reporter.suites;
    should.exist(suites.Suite1);
    var topic = suites.Suite1.topics.Topic1;
    should.exist(topic);
    should.exist(topic.tests.Test1);
    should.exist(topic.passed.Test1);
    should.not.exist(topic.failed.Test1);
    should.not.exist(topic.errors.Test1);

    topic.name.should.equal("Topic1");
    topic.testCount.should.equal(1);
    topic.successCount.should.equal(1);
    topic.failedCount.should.equal(0);
    topic.errorCount.should.equal(0);

    suites.Suite1.name.should.equal("Suite1");
    suites.Suite1.testCount.should.equal(1);
    suites.Suite1.successCount.should.equal(1);
    suites.Suite1.failedCount.should.equal(0);
    suites.Suite1.errorCount.should.equal(0);

    test.done();
};

exports.testRunSuiteTestsBadTests = function (test) {

    var testDetails = {
        testName: "Test1",
        topicName: "Topic1",
        suiteName: "Suite1",
        test: {
            hello: null
        }
    };

    var suiteManager = SuiteManager.createSuiteManager();
    try {
        suiteManager.runSuiteTest(testDetails);
        should.fail("Expected an error because there is no assert attribute in the test");
    } catch (e) {
        // Success
    }


    testDetails = {
        testName: "Test1",
        topicName: "Topic1",
        suiteName: "Suite1",
        test: {
            assert: 'hello'
        }
    };
    suiteManager = SuiteManager.createSuiteManager();
    try {
        suiteManager.runSuiteTest(testDetails);
        should.fail("Expected an error because the assert value is not a function");
    } catch (e) {
        // Success
    }

    test.done();
};

exports.testRunTestSuiteDuplicateTests = function(test) {

    var test1 = function () {
    };

    var testDetails = {
        testName: "Test1",
        topicName: "Topic1",
        suiteName: "Suite1",
        test: {
            assert: test1
        }
    };
    var suiteManager = SuiteManager.createSuiteManager();
    suiteManager.runSuiteTest(testDetails);
    suiteManager.runSuiteTest(testDetails);

    var reporter = reporterFactory.createSuiteStoreReporter();
    suiteManager.generateReport(reporter);

    var suites = reporter.suites;
    should.exist(suites.Suite1);
    var topic = suites.Suite1.topics.Topic1;
    should.exist(topic);
    should.exist(topic.tests.Test1);
    should.exist(topic.passed.Test1);
    should.not.exist(topic.failed.Test1);
    should.not.exist(topic.errors.Test1);

    topic.name.should.equal("Topic1");
    topic.testCount.should.equal(1);
    topic.successCount.should.equal(1);
    topic.failedCount.should.equal(0);
    topic.errorCount.should.equal(0);

    suites.Suite1.name.should.equal("Suite1");
    suites.Suite1.testCount.should.equal(1);
    suites.Suite1.successCount.should.equal(1);
    suites.Suite1.failedCount.should.equal(0);
    suites.Suite1.errorCount.should.equal(0);

    test.done();
};
