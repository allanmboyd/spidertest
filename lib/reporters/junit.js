var exceptions = require("exceptions");
var formatErrors = require("formaterrors");
var os = require("os");
var xmlDom = require("xmldom");

var failTheme = new formatErrors.StackTheme();

module.exports = function (options) {
    return junitReporter(options);
};

var junitReporter = function (options) {
    return {
        report: function (suites, ResultType) {
            var nowString = new Date().toISOString();
            var dom = new xmlDom.DOMParser();
            var serializer = new xmlDom.XMLSerializer();
            var doc = dom.parseFromString(""); // create an empty doc
            var testsuitesElement = doc;
            if (Object.keys(suites).length > 1) {
                testsuitesElement = doc.createElement("testsuites");
                doc.appendChild(testsuitesElement);
            }

            for (var suiteName in suites) {
                if (suites.hasOwnProperty(suiteName)) {
                    var suite = suites[suiteName];
                    var testsuiteElement = doc.createElement("testsuite");
                    testsuitesElement.appendChild(testsuiteElement);
                    var nameAttr = suite.getName() + (suite.getDescription() ? " - " + suite.getDescription() : "");
                    testsuiteElement.setAttribute("name", nameAttr);
                    testsuiteElement.setAttribute("timestamp", nowString);
                    testsuiteElement.setAttribute("hostname", os.hostname());
                    testsuiteElement.setAttribute("time", "" + suite.getSuiteTime());

                    var topics = suite.getTopics();
                    for (var topicName in topics) {
                        if (topics.hasOwnProperty(topicName)) {
                            var topic = topics[topicName];

                            var testResults = topic.getTestResults();
                            for (var i = 0; i < testResults.length; i += 1) { // todo - change to forEach
                                var testResult = testResults[i];
                                var testcaseElement = doc.createElement("testcase");
                                testcaseElement.setAttribute("name", testResult.getName());
                                testcaseElement.setAttribute("classname", topic.getName());
                                testcaseElement.setAttribute("time", "" + testResult.getTestTime());
                                testsuiteElement.appendChild(testcaseElement);
                                if (testResult.getResult() === ResultType.FAIL) {
                                    failTheme.stackFilters = [testResult.getTestFile()];
                                    var failError = formatErrors.highlightError(testResult.getError(), failTheme);
                                    var failureElement = doc.createElement("failure");
                                    failureElement.setAttribute("name", failError.name);
                                    failureElement.setAttribute("message", failError.stack);
                                    testcaseElement.appendChild(failureElement);
                                } else if (testResult.getResult() === ResultType.ERROR) {
                                    var errorElement = doc.createElement("error");
                                    errorElement.setAttribute("name", testResult.getError().name);
                                    errorElement.setAttribute("message", testResult.getError().stack);
                                    testcaseElement.appendChild(errorElement);
                                } else if (testResult.getResult() !== ResultType.PASS &&
                                    testResult.getResult() !== ResultType.NO_TESTS) {
                                    exceptions.ILLEGAL_STATE.thro("Unknown test result: " + util.inspect(testResult));
                                }
                            }
                        }
                    }
                    testsuiteElement.setAttribute("tests", "" + suite.getTestCount());
                    testsuiteElement.setAttribute("failures", "" + suite.getFailedCount());
                    testsuiteElement.setAttribute("errors", "" + suite.getErrorCount());
                }

            }
            var docAsString = serializer.serializeToString(doc);
            console.log(docAsString);
        }

    };
};
