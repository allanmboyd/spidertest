/**
 * MultiFileJUnitReporter
 * ----------------------
 *
 * Provides instances of Reporter that generate a JUnit xml formatted test report file for every test suite (i.e.
 * every spider tested URL). By default report files are placed in the current working directory. An alternative output
 * directory may be specified as an option to the _createReporter_ method.
 */
var formatErrors = require("formaterrors");
var fs = require("fs");
var logly = require("logly");
var os = require("os");
var path = require("path");
var Reporter = require("../Reporter");
var xmlDom = require("xmldom");

var failTheme = new formatErrors.StackTheme();

var MultiFileJUnitReporter = function() {};
MultiFileJUnitReporter.prototype = Reporter.createReporter();
MultiFileJUnitReporter.prototype.constructor = MultiFileJUnitReporter;

/**
 * Create a MultiFileJUnitReporter. By default the created reporter will place its report files into the current
 * working directory. To change this invoke this method with an _outputDir_ option e.g.:
 *
 *     createReporter({outputDir: '/tmp'});
 *
 * @param {Object} options Object. Currently there is only 1 option - outputDir. If specified
 * outputDir will cause the generated test suite files to be placed within the specified directory. If the specified
 * directory does not exist an attempt is made to create it.
 */
exports.createReporter = function(options) {
    var reporter = new MultiFileJUnitReporter();
    reporter.outputDir = (options && options.outputDir) || ".";

    reporter.suiteStart = suiteStart;
    reporter.suiteEnd = suiteEnd;
    reporter.topicStart = topicStart;
    reporter.testStart = testStart;
    reporter.testFailure = testFailure;
    reporter.testError = testError;
    
    return reporter;
};

var suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime) {
    this.suiteName = suiteName;
    this.dom = new xmlDom.DOMParser();
    this.doc = this.dom.parseFromString(""); // create an empty doc
    var nowString = new Date().toISOString();
    this.testsuiteElement = this.doc.createElement("testsuite");
    this.doc.appendChild(this.testsuiteElement);
    var nameAttr = suiteName + (suiteDescription ? " - " + suiteDescription : "");
    this.testsuiteElement.setAttribute("name", nameAttr);
    this.testsuiteElement.setAttribute("timestamp", nowString);
    this.testsuiteElement.setAttribute("hostname", os.hostname());
    this.testsuiteElement.setAttribute("tests", "" + testCount);
    this.testsuiteElement.setAttribute("failures", "" + failedCount);
    this.testsuiteElement.setAttribute("errors", "" + errorCount);
    this.testsuiteElement.setAttribute("time", "" + suiteTime);
};

var suiteEnd = function() {
    checkTargetDir(this.outputDir);

    var serializer = new xmlDom.XMLSerializer();
    var docAsString = serializer.serializeToString(this.doc);
    var target = this.outputDir + "/" + fixFilename(this.suiteName) + ".xml";

    fs.writeFile(target, docAsString, "utf8", function (error) {
        if (error) {
            logly.warn("Failed to write file '" + target + "'");
            logly.error(error.stack);
        }
    });
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

function checkTargetDir(targetDir) {
    if (!path.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, "0755");
    }
}

function fixFilename(filename) {
    filename = filename.replace("http://","");
    filename = filename.replace(/\//g, "-");
    return filename;
}