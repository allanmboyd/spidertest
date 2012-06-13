var Reporter = require('../lib/Reporter');

exports.testReporterInterface = function(test) {
    var CustomReporter = function() {};
    CustomReporter.prototype = Reporter.createReporter();
    CustomReporter.prototype.constructor = CustomReporter;

    var reporter = new CustomReporter();

    reporter.suitesStart();
    reporter.suiteStart();
    reporter.topicStart();
    reporter.testStart();
    reporter.testSuccess();
    reporter.testFailure();
    reporter.testError();
    reporter.testEnd();
    reporter.topicEnd();
    reporter.suiteEnd();
    reporter.suitesEnd();

    test.done();
};