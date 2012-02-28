var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");

var spiderTestModule = loadModule("./lib/spiderTest.js");
var spiderTest = spiderTestModule.module.exports;

var Suite = spiderTest.Suite;
var Result = spiderTest.Result;

exports.testCreateTestResult = function (test) {
    var testResult = spiderTest.createTestResult("testName", Result.PASS);
    should.exist(testResult);
    should.equal("testName", testResult.getName());
    should.equal(Result.PASS, testResult.getResult());
    test.done();
};

exports.testCreateSuite = function (test) {
    var suite = spiderTest.createSuite("suitename");
    should.exist(suite);
    should.ok(suite instanceof Suite);
    should.equal("suitename", suite.getName());
    suite = spiderTest.createSuite("suitename", "description");
    should.exist(suite);
    should.equal("suitename", suite.getName());
    should.equal("description", suite.getDescription());
    should.equal(0, suite.getTestCount());
    should.equal(0, suite.getFailedCount());
    should.equal(0, suite.getSuccessCount());
    should.equal(0, suite.getErrorCount());
    test.done();
};