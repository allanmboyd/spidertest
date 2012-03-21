var fs = require("fs");
var spider = require("./spider");
var spiderOptions = require("./spiderOptions");
var suiteManager = require("./suiteManager");
var timers = require("timers");
var urlModule = require("url");
var util = require("util");

var SPIDER_COMPLETED_TIMEOUT = 1000; // todo make configurable
var timeout;

var autoSpiderAll = spider({
    throwOnMissingRoute: true,
    autoSpider: spiderOptions.AUTO.ANCHORS | spiderOptions.AUTO.LINKS |
        spiderOptions.AUTO.IMAGES | spiderOptions.AUTO.SCRIPTS
});

/**
 * Run spider tests.
 * 
 * @param startUrl the initial url from which to start spidering
 * @param testsDir directory containing the test definitions - this should be absolute unless baseDir
 * is also specifed
 * @param {Function} callback optional callback function invoked when all tests are completed
 * @param {String} baseDir optional working dir to change to if specified. If testsDir is relative then it is
 * relative to this dir.
 * @param {Object} reporter an instantiated reporter to use for generating the test report. If not specified then
 * the console reporter is used.
 */
exports.runTests = function (startUrl, testsDir, callback, baseDir, reporter) {

    var origDir;

    if(baseDir) {
        origDir = process.cwd();
        process.chdir(baseDir);
    }
    startUrl = resolveUrl(startUrl);

    var testFiles = populateTestFiles(testsDir, []);
    // todo handle case where there are no tests

    var done = function() {
        if(origDir) {
            process.chdir(origDir);
        }
        suiteManager.generateReport(reporter);
        if(callback) {
            callback();
        }
    };

    // :-( cannot think of another to know when all the URLs have been spidered except to timeout
    timeout = timers.setTimeout(done, SPIDER_COMPLETED_TIMEOUT);
    
    autoSpiderAll
        .route(startUrl.host, "/*",
        function ($) {
            // Got a response that we can use so clear the timeout and restart it
            timers.clearTimeout(timeout);
            timeout = timers.setTimeout(done, SPIDER_COMPLETED_TIMEOUT);
            var payload = this;
            executeMatchingTests(payload, $, testFiles);
        })
        .get(startUrl.href)
        .log("error");


};

/**
 * Iterate over all of the tests. Any test whose topic.urlPattern matches the url of the route of the payload request
 * is executed as part of the testsuite that is named after the test file in which the matching test was found.
 * @param {Object} payload a payload from spider
 * @param {Object} $ the $ from the spider response
 * @param {String []} testFiles all of the test files containing the tests to execute
 */
var executeMatchingTests = function (payload, $, testFiles) {

    testFiles.forEach(function (testFile) {
        var tests = require(testFile).tests;
        for (var topic in tests) {
            if (tests.hasOwnProperty(topic)) {
//                console.log(testFile + ": " + topic);
                var topicName = topic;
                topic = tests[topic];
                var requestHref = payload.spider.currentUrl;
                if(requestHref.match(topic.urlPattern)) {
//                    console.log("matched " + requestHref + " with " + topic.urlPattern);
                    var topicTests = topic.tests;
                    for(var topicTest in topicTests) {
                        if(topicTests.hasOwnProperty(topicTest)) {
                            var testName = topicTest;
                            topicTest = topicTests[topicTest];
                            var testDetails = {
                                testName: testName,
                                topicName: topicName,
                                suiteName: requestHref,
                                test: topicTest,
                                testFile: testFile,
                                spiderPayload: payload,
                                $: $
                            };
                            suiteManager.runSuiteTest(testDetails);
                        }
                    }
                }
            }
        }
    });

//    console.log(util.inspect(payload));

};

/**
 * Recursively iterate over all files and subdirectories under the testsDir and add all files found into a given
 * tests array. It is assumed that all files are test files.
 *
 * @param {String} testsDir the directory containing test
 * @param {String []} tests array to populate with test files
 * @private
 */
function populateTestFiles(testsDir, tests) {
    var dirContents = fs.readdirSync(testsDir);
    dirContents.forEach(function (fileOrDir) {
        var path = testsDir + "/" + fileOrDir;
        var stats = fs.statSync(path);
        if (stats.isDirectory()) {
            populateTestFiles(path, tests);
        } else {
            path = path.indexOf("/") === 0 ? path : "./" + path;
            tests.push(path);
        }
    });

    return tests;
}

/**
 * Given a url string resolve to a url object that includes protcol, host, port and absolute path. If the url
 * string does not include scheme, host, or port then the following defaults are used:
 *     protocol: http
 *     host: localhost
 *     port: 80
 *
 * @param {String} urlString the url string to resolve
 * @return {Url} a resolved url object
 * @private
 */
function resolveUrl(urlString) {
    var url = urlModule.parse(urlString);
    if (!url.protocol) {
        url.protocol = "http:";
    }
    if (!url.hostname) {
        url.hostname = "localhost";
    }
    if (!url.port) {
        url.port = "80";
    }
    url.host = url.hostname + ":" + url.port;
    if (!url.path || url.path.indexOf("/") !== 0) {
        url.path = "/" + url.path;
    }
    if (!url.slashes) {
        url.slashes = true;
    }
    url.href = url.protocol + "//" + url.hostname + ":" + url.port + url.path;

    return url;
}