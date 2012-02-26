
var util = require("util");

var totalFailed = 0;

var currentSuite;

var suites = {};

var Result = {
    PASS : "successful",
    FAIL : "failed",
    ERROR : "error"
};

var Suite = function () {
};

var createSuite = function (name, description) {
    var o = new Suite();
    var testResults = [];
    var successCount = 0;
    var failedCount = 0;
    var errorCount = 0;

    o.getName = function () {
        return name;
    };

    o.getDescription = function () {
        return description;
    };

    o.getTestCount = function () {
        return testResults.length;
    };

    o.getSuccessCount = function () {
        return successCount;
    };

    o.getFailedCount = function () {
        return failedCount;
    };

    o.getErrorCount = function () {
        return errorCount;
    };

    o.addTestResult = function (testResult) {
        switch (testResult.getResult()) {
            case Result.PASS:
                successCount += 1;
                break;
            case Result.FAIL:
                failedCount += 1;
                totalFailed += 1;
                break;
            case Result.ERROR:
                errorCount += 1;
                totalFailed += 1;
                break;
            default:
                throw new Error("Unexpected test result: " + testResult);
        }
        testResults.push(testResult);
    };

    o.getTestResults = function () {
        return testResults;
    };

    return o;
};

var TestResult = function () {
};

var createTestResult = function (name, result, error) {

    if(result === Result.PASS && error) {
        throw new Error("IllegalArgument", "There should be no error when the test result is a PASS");
    }

    var o = new TestResult();

    o.getName = function () {
        return name;
    };

    o.getResult = function () {
        return result;
    };

    o.getError = function () {
        return error;
    };

    return o;
};

var createNewSuite = function(name, description) {
    var suite = createSuite(name, description);
    suites[name] = suite;
    currentSuite = suite;
};


var runSuiteTest = function (testName, suiteName, test) {
    var success = false;
    var suite = suites[suiteName];
    if (!suite) {
        throw new Error("No such suite: " + suiteName);
    }
    try {
        success = test();
        suite.addTestResult(createTestResult(testName, Result.PASS));
    } catch (error) {
        if (error.name === "AssertionError") {
            suite.addTestResult(createTestResult(testName, Result.FAIL, error));
        } else {
            suite.addTestResult(createTestResult(testName, Result.ERROR, error));
        }
    }
};

exports.Suite = Suite;
exports.Result = Result;
exports.createTestResult = createTestResult;
exports.createSuite = createSuite;
exports.runSuiteTest = runSuiteTest;

exports.runTest = function (name, test) {
    if (!currentSuite) {
        createNewSuite("Suite");
    }
    runSuiteTest(name, currentSuite.getName(), test);
};

exports.generateReport = function (reporter) {
    switch (reporter) {
        case "junit":
            generateJunitReport();
            break;
        default:
            generateDefaultReport();
    }

    return totalFailed;
};

var options = {
    "error_prefix": "\u001B[31m",
    "error_suffix": "\u001B[39m",
    "ok_prefix": "\u001B[32m",
    "ok_suffix": "\u001B[39m",
    "bold_prefix": "\u001B[1m",
    "bold_suffix": "\u001B[22m",
    "assertion_prefix": "\u001B[35m",
    "assertion_suffix": "\u001B[39m"
};

function generateDefaultReport() {

    var error = function (str) {
        return options.error_prefix + str + options.error_suffix;
    };
    var ok = function (str) {
        return options.ok_prefix + str + options.ok_suffix;
    };
    var bold = function (str) {
        return options.bold_prefix + str + options.bold_suffix;
    };
    var assertion_message = function (str) {
        return options.assertion_prefix + str + options.assertion_suffix;
    };

    for (var suiteName in suites) {
        var totalTests = 0;
        var totalSuccess = 0;
        var totalFailed = 0;
        var totalErrors = 0;

        if (suites.hasOwnProperty(suiteName)) {
            var suite = suites[suiteName];
            var output = suite.getName();
            if (suite.getDescription()) {
                output += " - " + suite.getDescription();
            }
            console.log(bold(output));
            var testResults = suite.getTestResults();
            for (var i = 0; i < testResults.length; i += 1) {
                var testResult = testResults[i];
                if (testResult.getResult() === Result.PASS) {
                    console.log(ok('✔ ' + testResult.getName()));
                }
                if (testResult.getResult() === Result.FAIL) {
                    var ae = formatAssertionError(testResult.getError());
                    console.log(error('✖ ' + testResult.getName() + ": " + assertion_message(ae.message)));
//                        console.log(ae.stack + '\n');
                }
                if (testResult.getResult() === Result.ERROR) {
                    console.log(error("\u274e " + testResult.getName()) + '\n');
                    console.log(testResult.getError());
                }
                var detail = testResults[i].getName() + ": " + testResults[i].getResult();
                if (testResults[i].getError() != null) {
                    detail += " - " + testResults[i].getError();
                }
            }

            totalTests += suite.getTestCount();
            totalSuccess += suite.getSuccessCount();
            totalFailed += suite.getFailedCount();
            totalErrors += suite.getErrorCount();
        }
    }


    var summary = "Tests: " + totalTests + ", Passed: " + totalSuccess +
        ", Failed: " + totalFailed + ", Errors: " + totalErrors;

    if (totalFailed == 0 && totalErrors == 0) {
        console.log(bold(ok(summary)));
    } else {
        console.log(bold(error(summary)));
    }
}

function generateJunitReport() {

}

function formatAssertionError(e) {

    if (e.actual && e.expected) {
        var actual = util.inspect(e.actual, false, 10).replace(/\n$/, '');
        var expected = util.inspect(e.expected, false, 10).replace(/\n$/, '');

        var multiline = (
            (actual && actual.indexOf('\n') !== -1) ||
                (expected && expected.indexOf('\n') !== -1)
            );
        var spacing = (multiline ? '\n' : ' ');

        e._message = e.message;
        e.message = "expected" + spacing + expected + spacing + "got" + spacing + actual +
            spacing + "(" + e.operator + ")";

        e.stack = (
            e.name + ':' + spacing +
                actual + spacing + e.operator + spacing +
                expected + '\n' +
                e.stack.split('\n').slice(1).join('\n')
            );
    }

    return e;
}
