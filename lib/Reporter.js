var Reporter = function () {};
Reporter.prototype.suitesStart = function () {};
Reporter.prototype.suitesEnd = function(testCount, successCount, failedCount, errorCount, suitesTime) {};
Reporter.prototype.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {};
Reporter.prototype.suiteEnd = function() {};
Reporter.prototype.topicStart = function(topicName, topicDescription, testCount, successCount, failedCount, errorCount, topicTime) {};
Reporter.prototype.topicEnd = function() {};
Reporter.prototype.testStart = function(testName, testTime, testFile) {};
Reporter.prototype.testEnd = function() {};
Reporter.prototype.testSuccess = function(testName, testTime, testFile) {};
Reporter.prototype.testFailure = function(testName, error, testTime, testFile) {};
Reporter.prototype.testError = function(testName, error, testTime, testFile) {};

/**
 * Reporter implementations should inherit from the Reporter my requiring Reporter and invoking:
 *     new Reporter();
 */
module.exports = function () {
    return Reporter;
};

/**
 * Reporter implementations should implement this method to return a new instance of their Reporter.
 * @param {String} options to pass into the reporter. It is up to the reporter to determine what to do with these
 * options.
 * @return {Reporter} a new instance of Reporter that would be expected to override at least some of the Reporter
 * prototype methods.
 */
exports.createReporter = function (options) {
    return new Reporter();
};