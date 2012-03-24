var formatErrors = require("formaterrors");
var Reporter = require("../Reporter");
var os = require("os");
var xmlDom = require("xmldom");

var failTheme = new formatErrors.StackTheme();

var JUnitReporter = new Reporter();
JUnitReporter.prototype.constructor = JUnitReporter;
JUnitReporter.prototype.suitesStart = function() {
    this.nowString = new Date().toISOString();
    this.dom = new xmlDom.DOMParser();
    this.doc = this.dom.parseFromString(""); // create an empty doc
    this.testsuitesElement = this.doc.createElement("testsuites");
    this.doc.appendChild(this.testsuitesElement);
};

JUnitReporter.prototype.suitesEnd = function() {
    var serializer = new xmlDom.XMLSerializer();
    var docAsString = serializer.serializeToString(this.doc);
    console.log(docAsString);
};

JUnitReporter.prototype.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
    var nowString = new Date().toISOString();
    this.testsuiteElement = this.doc.createElement("testsuite");
    this.testsuitesElement.appendChild(this.testsuiteElement);
    var nameAttr = suiteName + (suiteDescription ? " - " + suiteDescription : "");
    this.testsuiteElement.setAttribute("name", nameAttr);
    this.testsuiteElement.setAttribute("timestamp", nowString);
    this.testsuiteElement.setAttribute("hostname", os.hostname());
    this.testsuiteElement.setAttribute("tests", "" + testCount);
    this.testsuiteElement.setAttribute("failures", "" + failedCount);
    this.testsuiteElement.setAttribute("errors", "" + errorCount);
    this.testsuiteElement.setAttribute("time", "" + suiteTime);

};

JUnitReporter.prototype.topicStart = function(topicName, topicDescription) {
    this.topicName = topicName + (topicDescription ? " - " + topicDescription : "");
};

JUnitReporter.prototype.testStart = function(testName, testTime) {
    this.testcaseElement = this.doc.createElement("testcase");
    this.testcaseElement.setAttribute("name", testName);
    this.testcaseElement.setAttribute("classname", this.topicName);
    this.testcaseElement.setAttribute("time", "" + testTime);
    this.testsuiteElement.appendChild(this.testcaseElement);
};

JUnitReporter.prototype.testFailure = function(testName, error, testFile) {
    failTheme.stackFilters = [testFile];
    var failError = formatErrors.highlightError(error, failTheme);
    var failureElement = this.doc.createElement("failure");
    failureElement.setAttribute("name", failError.name);
    failureElement.setAttribute("message", failError.stack);
    this.testcaseElement.appendChild(failureElement);
};

JUnitReporter.prototype.testError = function(testName, error) {
    var errorElement = this.doc.createElement("error");
    errorElement.setAttribute("name", error.name);
    errorElement.setAttribute("message", error.stack);
    this.testcaseElement.appendChild(errorElement);
};

module.exports = function () {
    return JUnitReporter;
};
