var formatErrors = require("formaterrors");
var Reporter = require("../Reporter");
var os = require("os");
var xmlDom = require("xmldom");

var failTheme = new formatErrors.StackTheme();

var JUnitReporter = function() {};
JUnitReporter.prototype = Reporter.createReporter();
JUnitReporter.prototype.constructor = JUnitReporter;

exports.createReporter = function () {
    var reporter = new JUnitReporter();
    reporter.suitesStart = suitesStart;
    reporter.suitesEnd = suitesEnd;
    reporter.suiteStart = suiteStart;
    reporter.topicStart = topicStart;
    reporter.testStart = testStart;
    reporter.testFailure = testFailure;
    reporter.testError = testError;

    return reporter;
};

var suitesStart = function() {
    this.nowString = new Date().toISOString();
    this.dom = new xmlDom.DOMParser();
    this.doc = this.dom.parseFromString(""); // create an empty doc
    this.testsuitesElement = this.doc.createElement("testsuites");
    this.doc.appendChild(this.testsuitesElement);
};

var suitesEnd = function() {
    var serializer = new xmlDom.XMLSerializer();
    var docAsString = serializer.serializeToString(this.doc);
    console.log(docAsString);
};

var suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
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

var topicStart = function(topicName, topicDescription) {
    this.topicName = topicName + (topicDescription ? " - " + topicDescription : "");
};

var testStart = function(testName, testTime) {
    this.testcaseElement = this.doc.createElement("testcase");
    this.testcaseElement.setAttribute("name", testName);
    this.testcaseElement.setAttribute("classname", this.topicName);
    this.testcaseElement.setAttribute("time", "" + testTime);
    this.testsuiteElement.appendChild(this.testcaseElement);
};

var testFailure = function(testName, error, testFile) {
    failTheme.stackFilters = [testFile];
    var failError = formatErrors.highlightError(error, failTheme);
    var failureElement = this.doc.createElement("failure");
    failureElement.setAttribute("name", failError.name);
    failureElement.setAttribute("message", failError.stack);
    this.testcaseElement.appendChild(failureElement);
};

var testError = function(testName, error) {
    var errorElement = this.doc.createElement("error");
    errorElement.setAttribute("name", error.name);
    errorElement.setAttribute("message", error.stack);
    this.testcaseElement.appendChild(errorElement);
};

