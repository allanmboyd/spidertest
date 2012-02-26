var should = require("should");
var tunit = require("../lib/spiderTest");
var Suite = tunit.Suite;
var Result = tunit.Result;

exports.testCreateTestResult = function (test) {
    var testResult = tunit.createTestResult("testName", Result.PASS, "error");
    should.exist(testResult);
    should.equal("testName", testResult.getName());
    should.equal(Result.PASS, testResult.getResult());
    test.done();
};

exports.testCreateSuite = function (test) {
    var suite = tunit.createSuite("suitename");
    should.exist(suite);
    should.ok(suite instanceof Suite);
    should.equal("suitename", suite.getName());
    suite = tunit.createSuite("suitename", "description");
    should.exist(suite);
    should.equal("suitename", suite.getName());
    should.equal("description", suite.getDescription());
    should.equal(0, suite.getTestCount());
    should.equal(0, suite.getFailedCount());
    should.equal(0, suite.getSuccessCount());
    should.equal(0, suite.getErrorCount());
    test.done();
};