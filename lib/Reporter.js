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

module.exports = function () {
    return Reporter;
};