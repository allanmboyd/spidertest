var Reporter = require("../lib/Reporter");
var express = require("express");
var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");

var spiderTestModule = loadModule("./lib/spiderTest.js");
var spiderTest = require("../lib/spiderTest");

exports.testResolveUrl = function (test) {
    var url = spiderTestModule.resolveUrl("http://nodejs.org");
    "http:".should.equal(url.protocol);
    "nodejs.org".should.equal(url.hostname);
    "80".should.equal(url.port);
    "/".should.equal(url.path);
    "nodejs.org:80".should.equal(url.host);
    "http://nodejs.org:80/".should.equal(url.href);

    url = spiderTestModule.resolveUrl("hello");

    "http:".should.equal(url.protocol);
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "/hello".should.equal(url.path);
    "http://localhost:80/hello".should.equal(url.href);

    url = spiderTestModule.resolveUrl("http://localhost:80/");
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "http://localhost:80/".should.equal(url.href);

    test.done();
};

exports.testPopulateTestFiles = function (test) {
    var tests = [];
    spiderTestModule.populateTestFiles("test/resources/testJS", tests);
    tests.length.should.equal(2);
    tests[0].should.equal("./test/resources/testJS/some.js");
    tests[1].should.equal("./test/resources/testJS/somemoretests/anotherTest.js");

    test.done();
};

exports.testAddMixinsToTopic = function (test) {
    var topic = {
        urlPattern: "/",
        tests: {
            '@include': 'commonHTMLTests'
        }
    };

    var mixins = {
        commonHTMLTests: {
            "HTML responses should have a statusCode of 200": {
                assert: function (spiderPayload) {
                    should.equal(spiderPayload.response.statusCode, 200);
                }
            },
            "HTML responses should have a content type of text/html; charset=UTF-8": {
                assert: function (spiderPayload) {
                    should.equal("text/html; charset=UTF-8", spiderPayload.response.headers['content-type']);
                }
            }
        },
        someOtherTests: {
            "1 should be equal to 1": {
                assert: function() {
                    should.equal(1, 1);
                }
            }
        }
    };

    should.exist(topic.tests['@include']);
    spiderTestModule.addMixinsToTopic(topic, mixins);
    should.not.exist(topic.tests['@include']);
    should.exist(topic.tests['HTML responses should have a statusCode of 200']);
    should.exist(topic.tests['HTML responses should have a content type of text/html; charset=UTF-8']);

    topic = {
        urlPattern: "/",
        tests: {
            '@include': 'commonHTMLTests'
        }
    };

    spiderTestModule.addMixinsToTopic(topic, undefined);
    should.exist(topic.tests['@include']);

    topic = {
        urlPattern: "/",
        tests: {
            '@include': 'nonExistantMixin'
        }
    };

    try {
        spiderTestModule.addMixinsToTopic(topic, mixins);
        should.fail("Expected to throw an exception because the mixin specified does not exist");
    } catch(e) {
        e.message.should.equal("Reference made to non-existing mixin: nonExistantMixin");
    }

    topic = {
        urlPattern: "/",
        tests: {
            '@include': ['commonHTMLTests', 'someOtherTests'],
            'This is a test': {
                'number 3': 'the larch'
            }
        }
    };

    spiderTestModule.addMixinsToTopic(topic, mixins);

    should.not.exist(topic.tests['@include']);
    should.exist(topic.tests['HTML responses should have a statusCode of 200']);
    should.exist(topic.tests['HTML responses should have a content type of text/html; charset=UTF-8']);
    should.exist(topic.tests['This is a test']);
    should.exist(topic.tests['1 should be equal to 1']);
    topic.tests['1 should be equal to 1'].assert();

    test.done();
};

exports.testRunTestsWithDefaultReporter = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    // For some reason "process" is not available inside modules that are tested by nodeunit
    // this is why process is used here to establish the test directory
    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTests", function() {
            server.close();
            test.done();
        });
};


exports.testRunTestsWithProvidedReporter = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    // For some reason "process" is not available inside modules that are tested by nodeunit
    // this is why process is used here to establish the test directory
    // Use a jnuit reporter
    var junitReporter = require("../lib/reporters/JUnitReporter").createReporter();
    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTests", function() {
            server.close();
            test.done();
        }, null, junitReporter);
};

exports.testRunTests = function (test) {

    var server = startServer();
    var serverPort = server.address().port;

    var reporter = new Reporter();
    var suitesStartCount = 0;
    var suiteStartCount = 0;
    var topicStartCount = 0;
    var testStartCount = 0;
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;
    var testEndCount = 0;
    var topicEndCount = 0;
    var suiteEndCount = 0;
    var suitesEndCount = 0;
    reporter.suitesStart = function() {
        suitesStartCount += 1;
    };
    reporter.suiteStart = function() {
        suiteStartCount += 1;
    };
    reporter.topicStart = function() {
        topicStartCount += 1;
    };
    reporter.testStart = function() {
        testStartCount += 1;
    };
    reporter.testSuccess = function() {
        successCount += 1;
    };
    reporter.testFailure = function() {
        failedCount += 1;
    };
    reporter.testError = function() {
        errorCount += 1;
    };
    reporter.testEnd = function() {
        testEndCount += 1;
    };
    reporter.topicEnd = function() {
        topicEndCount += 1;
    };
    reporter.suiteEnd = function() {
        suiteEndCount += 1;
    };
    reporter.suitesEnd = function() {
        suitesEndCount += 1;
    };

    var runAgain = function() {
        spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
            process.cwd() + "/" + "test/resources/spiderTests", function() {
                server.close();

                should.equal(suitesStartCount, 1, "there should be only 1 suitesStart call");
                should.equal(suiteStartCount, 3, "there should be 3 suiteStart calls");
                should.equal(topicStartCount, 4, "there should be 4 topicStart calls");
                should.equal(testStartCount, 7, "there should be 7 testStart calls");
                should.equal(successCount, 4, "there should be 4 successes");
                should.equal(failedCount, 3, "there should be 3 failures");
                should.equal(errorCount, 0, "there should be no errors");
                should.equal(testEndCount, 7, "there should be 7 testEnd calls");
                should.equal(topicEndCount, 4, "there should be 4 topicEnd calls");
                should.equal(suiteEndCount, 3, "there should be 9 suiteEnd calls");
                should.equal(suitesEndCount, 1, "there should be 1 suitesEnd call");

                test.done();
            }, null, reporter);
    };


    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTests", function() {

            should.equal(suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(topicStartCount, 4, "there should be 4 topicStart calls");
            should.equal(testStartCount, 7, "there should be 7 testStart calls");
            should.equal(successCount, 4, "there should be 4 successes");
            should.equal(failedCount, 3, "there should be 3 failures");
            should.equal(errorCount, 0, "there should be no errors");
            should.equal(testEndCount, 7, "there should be 7 testEnd calls");
            should.equal(topicEndCount, 4, "there should be 4 topicEnd calls");
            should.equal(suiteEndCount, 3, "there should be 9 suiteEnd calls");
            should.equal(suitesEndCount, 1, "there should be 1 suitesEnd call");

            suitesStartCount = 0;
            suiteStartCount = 0;
            topicStartCount = 0;
            testStartCount = 0;
            successCount = 0;
            failedCount = 0;
            errorCount = 0;
            testEndCount = 0;
            topicEndCount = 0;
            suiteEndCount = 0;
            suitesEndCount = 0;

            runAgain();
        }, null, reporter);
};

exports.testRunTestsWithHeaders = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = new Reporter();
    var suitesStartCount = 0;
    var suiteStartCount = 0;
    var topicStartCount = 0;
    var testStartCount = 0;
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;
    var testEndCount = 0;
    var topicEndCount = 0;
    var suiteEndCount = 0;
    var suitesEndCount = 0;
    reporter.suitesStart = function() {
        suitesStartCount += 1;
    };
    reporter.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
        suiteStartCount += 1;
    };
    reporter.topicStart = function(topicName) {
        topicStartCount += 1;
    };
    reporter.testStart = function(testName) {
        testStartCount += 1;
    };
    reporter.testSuccess = function() {
        successCount += 1;
    };
    reporter.testFailure = function() {
        failedCount += 1;
    };
    reporter.testError = function() {
        errorCount += 1;
    };
    reporter.testEnd = function() {
        testEndCount += 1;
    };
    reporter.topicEnd = function() {
        topicEndCount += 1;
    };
    reporter.suiteEnd = function() {
        suiteEndCount += 1;
    };
    reporter.suitesEnd = function() {
        suitesEndCount += 1;
    };

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTestsWithHeaders", function() {
            server.close();

            should.equal(suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(topicStartCount, 5, "there should be 5 topicStart calls");
            should.equal(testStartCount, 15, "there should be 15 testStart calls");
            should.equal(successCount, 15, "there should be 15 successes");
            should.equal(failedCount, 0, "there should be 0 failures");
            should.equal(errorCount, 0, "there should be no errors");
            should.equal(testEndCount, 15, "there should be 15 testEnd calls");
            should.equal(topicEndCount, 5, "there should be 5 topicEnd calls");
            should.equal(suiteEndCount, 3, "there should be 3 suiteEnd calls");
            should.equal(suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};

exports.testRunTestsWithMixins = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = new Reporter();
    var suitesStartCount = 0;
    var suiteStartCount = 0;
    var topicStartCount = 0;
    var testStartCount = 0;
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;
    var testEndCount = 0;
    var topicEndCount = 0;
    var suiteEndCount = 0;
    var suitesEndCount = 0;
    reporter.suitesStart = function() {
        suitesStartCount += 1;
    };
    reporter.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
        suiteStartCount += 1;
    };
    reporter.topicStart = function(topicName) {
        topicStartCount += 1;
    };
    reporter.testStart = function(testName) {
        testStartCount += 1;
    };
    reporter.testSuccess = function() {
        successCount += 1;
    };
    reporter.testFailure = function() {
        failedCount += 1;
    };
    reporter.testError = function() {
        errorCount += 1;
    };
    reporter.testEnd = function() {
        testEndCount += 1;
    };
    reporter.topicEnd = function() {
        topicEndCount += 1;
    };
    reporter.suiteEnd = function() {
        suiteEndCount += 1;
    };
    reporter.suitesEnd = function() {
        suitesEndCount += 1;
    };

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/mixinsTests", function() {
            server.close();

            should.equal(suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(topicStartCount, 3, "there should be 3 topicStart calls");
            should.equal(testStartCount, 9, "there should be 9 testStart calls");
            should.equal(successCount, 9, "there should be 9 successes");
            should.equal(failedCount, 0, "there should be 0 failures");
            should.equal(errorCount, 0, "there should be no errors");
            should.equal(testEndCount, 9, "there should be 9 testEnd calls");
            should.equal(topicEndCount, 3, "there should be 3 topicEnd calls");
            should.equal(suiteEndCount, 3, "there should be 3 suiteEnd calls");
            should.equal(suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};


exports.testRunTestsWithPathSubstitutions = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = new Reporter();
    var suitesStartCount = 0;
    var suiteStartCount = 0;
    var topicStartCount = 0;
    var testStartCount = 0;
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;
    var testEndCount = 0;
    var topicEndCount = 0;
    var suiteEndCount = 0;
    var suitesEndCount = 0;
    reporter.suitesStart = function() {
        suitesStartCount += 1;
    };
    reporter.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
        suiteStartCount += 1;
    };
    reporter.topicStart = function(topicName) {
        topicStartCount += 1;
    };
    reporter.testStart = function(testName) {
        testName.should.equal("The parent folder should be testFolder");
        testStartCount += 1;
    };
    reporter.testSuccess = function() {
        successCount += 1;
    };
    reporter.testFailure = function() {
        failedCount += 1;
    };
    reporter.testError = function() {
        errorCount += 1;
    };
    reporter.testEnd = function() {
        testEndCount += 1;
    };
    reporter.topicEnd = function() {
        topicEndCount += 1;
    };
    reporter.suiteEnd = function() {
        suiteEndCount += 1;
    };
    reporter.suitesEnd = function() {
        suitesEndCount += 1;
    };

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/pathVariablesTests", function() {
            server.close();

            should.equal(suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(suiteStartCount, 1, "there should be 1 suiteStart calls");
            should.equal(topicStartCount, 1, "there should be 1 topicStart calls");
            should.equal(testStartCount, 1, "there should be 1 testStart calls");
            should.equal(successCount, 1, "there should be 1 successes");
            should.equal(failedCount, 0, "there should be 0 failures");
            should.equal(errorCount, 0, "there should be no errors");
            should.equal(testEndCount, 1, "there should be 1 testEnd calls");
            should.equal(topicEndCount, 1, "there should be 1 topicEnd calls");
            should.equal(suiteEndCount, 1, "there should be 1 suiteEnd calls");
            should.equal(suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};

function startServer() {

    var server = express.createServer();

    server.configure(function() {
        server.use(server.router);
        server.use(express["static"]("test/resources"));
    });

    server.listen();
    return server;
}