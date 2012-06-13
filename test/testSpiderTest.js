var Reporter = require("../lib/Reporter");
var reporterFactory = require('./testHelpers/reporterFactory');
var express = require("express");
var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");

var spiderTestModule = loadModule("./lib/spiderTest.js");
var spiderTest = require("../lib/spiderTest");

exports.testResolveUrls = function (test) {
    var url = spiderTestModule.resolveUrls(["http://nodejs.org"])[0];
    "http:".should.equal(url.protocol);
    "nodejs.org".should.equal(url.hostname);
    "80".should.equal(url.port);
    "/".should.equal(url.path);
    "nodejs.org:80".should.equal(url.host);
    "http://nodejs.org:80/".should.equal(url.href);

    url = spiderTestModule.resolveUrls(["hello"])[0];

    "http:".should.equal(url.protocol);
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "/hello".should.equal(url.path);
    "http://localhost:80/hello".should.equal(url.href);

    url = spiderTestModule.resolveUrls(["http://localhost:80/"])[0];
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "http://localhost:80/".should.equal(url.href);

    var resolvedUrls = spiderTestModule.resolveUrls(["http://nodejs.org", "http://localhost:80/"]);
    resolvedUrls.length.should.equal(2);
    url = resolvedUrls[0];
    "http:".should.equal(url.protocol);
        "nodejs.org".should.equal(url.hostname);
        "80".should.equal(url.port);
        "/".should.equal(url.path);
        "nodejs.org:80".should.equal(url.host);
        "http://nodejs.org:80/".should.equal(url.href);

    url = resolvedUrls[1];
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

    var reporter = reporterFactory.createCountingReporter();
    
    var runAgain = function() {
        spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
            process.cwd() + "/" + "test/resources/spiderTests", function() {
                server.close();

                should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
                should.equal(reporter.suiteStartCount, 3, "there should be 3 suiteStart calls");
                should.equal(reporter.topicStartCount, 4, "there should be 4 topicStart calls");
                should.equal(reporter.testStartCount, 7, "there should be 7 testStart calls");
                should.equal(reporter.successCount, 4, "there should be 4 successes");
                should.equal(reporter.failedCount, 3, "there should be 3 failures");
                should.equal(reporter.errorCount, 0, "there should be no errors");
                should.equal(reporter.testEndCount, 7, "there should be 7 testEnd calls");
                should.equal(reporter.topicEndCount, 4, "there should be 4 topicEnd calls");
                should.equal(reporter.suiteEndCount, 3, "there should be 9 suiteEnd calls");
                should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

                test.done();
            }, null, reporter);
    };


    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTests", function() {

            should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(reporter.suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(reporter.topicStartCount, 4, "there should be 4 topicStart calls");
            should.equal(reporter.testStartCount, 7, "there should be 7 testStart calls");
            should.equal(reporter.successCount, 4, "there should be 4 successes");
            should.equal(reporter.failedCount, 3, "there should be 3 failures");
            should.equal(reporter.errorCount, 0, "there should be no errors");
            should.equal(reporter.testEndCount, 7, "there should be 7 testEnd calls");
            should.equal(reporter.topicEndCount, 4, "there should be 4 topicEnd calls");
            should.equal(reporter.suiteEndCount, 3, "there should be 9 suiteEnd calls");
            should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

            reporter = reporterFactory.createCountingReporter();
            runAgain();
        }, null, reporter);
};

exports.testRunTestsWithHeaders = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = reporterFactory.createCountingReporter();

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/spiderTestsWithHeaders", function() {
            server.close();

            should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(reporter.suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(reporter.topicStartCount, 7, "there should be 5 topicStart calls");
            should.equal(reporter.testStartCount, 18, "there should be 15 testStart calls");
            should.equal(reporter.successCount, 18, "there should be 15 successes");
            should.equal(reporter.failedCount, 0, "there should be 0 failures");
            should.equal(reporter.errorCount, 0, "there should be no errors");
            should.equal(reporter.testEndCount, 18, "there should be 15 testEnd calls");
            should.equal(reporter.topicEndCount, 7, "there should be 5 topicEnd calls");
            should.equal(reporter.suiteEndCount, 3, "there should be 3 suiteEnd calls");
            should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};

exports.testRunTestsWithMultipleStartUrls = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = reporterFactory.createCountingReporter();

    var startUrls = [
        "http://localhost:" + serverPort + "/anotherPage.html",
        "http://localhost:" + serverPort + "/testFolder/yetAnotherPage.html",
        "http://localhost:" + serverPort + "/sitemap.xml"
    ];

    spiderTest.runTests(startUrls,
        process.cwd() + "/" + "test/resources/spiderTestsWithMultiStartUrls", function() {
            server.close();

            should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(reporter.suiteStartCount, 4, "there should be 3 suiteStart calls");
            should.equal(reporter.topicStartCount, 5, "there should be 5 topicStart calls");
            should.equal(reporter.testStartCount, 16, "there should be 15 testStart calls");
            should.equal(reporter.successCount, 16, "there should be 15 successes");
            should.equal(reporter.failedCount, 0, "there should be 0 failures");
            should.equal(reporter.errorCount, 0, "there should be no errors");
            should.equal(reporter.testEndCount, 16, "there should be 15 testEnd calls");
            should.equal(reporter.topicEndCount, 5, "there should be 5 topicEnd calls");
            should.equal(reporter.suiteEndCount, 4, "there should be 3 suiteEnd calls");
            should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};

exports.testRunTestsWithMixins = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = reporterFactory.createCountingReporter();

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/mixinsTests", function() {
            server.close();

            should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(reporter.suiteStartCount, 3, "there should be 3 suiteStart calls");
            should.equal(reporter.topicStartCount, 3, "there should be 3 topicStart calls");
            should.equal(reporter.testStartCount, 9, "there should be 9 testStart calls");
            should.equal(reporter.successCount, 9, "there should be 9 successes");
            should.equal(reporter.failedCount, 0, "there should be 0 failures");
            should.equal(reporter.errorCount, 0, "there should be no errors");
            should.equal(reporter.testEndCount, 9, "there should be 9 testEnd calls");
            should.equal(reporter.topicEndCount, 3, "there should be 3 topicEnd calls");
            should.equal(reporter.suiteEndCount, 3, "there should be 3 suiteEnd calls");
            should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

            test.done();
        }, null, reporter);
};


exports.testRunTestsWithPathSubstitutions = function (test) {
    var server = startServer();
    var serverPort = server.address().port;

    var reporter = reporterFactory.createCountingReporter();

    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html",
        process.cwd() + "/" + "test/resources/pathVariablesTests", function() {
            server.close();

            should.equal(reporter.suitesStartCount, 1, "there should be only 1 suitesStart call");
            should.equal(reporter.suiteStartCount, 1, "there should be 1 suiteStart calls");
            should.equal(reporter.topicStartCount, 1, "there should be 1 topicStart calls");
            should.equal(reporter.testStartCount, 1, "there should be 1 testStart calls");
            should.equal(reporter.successCount, 1, "there should be 1 successes");
            should.equal(reporter.failedCount, 0, "there should be 0 failures");
            should.equal(reporter.errorCount, 0, "there should be no errors");
            should.equal(reporter.testEndCount, 1, "there should be 1 testEnd calls");
            should.equal(reporter.topicEndCount, 1, "there should be 1 topicEnd calls");
            should.equal(reporter.suiteEndCount, 1, "there should be 1 suiteEnd calls");
            should.equal(reporter.suitesEndCount, 1, "there should be 1 suitesEnd call");

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