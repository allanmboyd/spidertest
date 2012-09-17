var fs = require("fs");
var spiderModule = require("./spider");
var spiderOptions = require("./spiderOptions");
var suiteManager = require("./suiteManager");
var spiderUtils = require("./spiderUtils");
var timers = require("timers");
var urlModule = require("url");
var und = require("underscore");
var retainCookies = true;
var SPIDER_COMPLETED_TIMEOUT = 1000; // todo make configurable
var timeout;
var testFiles;

var DEFAULT_HEADERS = {
    'accept': "application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,image/jpg,*/*;q=0.5",
    'accept-language': 'en-US,en;q=0.8',
    'accept-charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'user-agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) ' +
        'AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7'
};

/**
 * Run spider tests.
 *
 * @param {String | String []} startUrls the initial url from which to start spidering - this can be a single string or
 * an array of strings
 * @param {String} testsDir directory containing the test definitions - this should be absolute unless baseDir
 * is also specifed
 * @param {Function} callback optional callback function invoked when all tests are completed
 * @param {String} baseDir optional working dir to change to if specified. If testsDir is relative then it is
 * relative to this dir.
 * @param {Reporter | Reporter []} reporter one or more instantiated reporters to use for generating the test report. If not specified then
 * the console reporter is used. This argument can be a single Reporter or an array of Reporters.
 * @config {Config} config a Config object from nconf describing the options for running the tests
 */
exports.runTests = function (startUrls, testsDir, callback, baseDir, reporter, config) {
    var failOnMissingRoute = config && config.get("failOnMissingRoute") !== "false";
    var failOnNoResponse = config && config.get("failOnNoResponse") !== "false";
    var spiderCrossDomain = config && config.get("spiderCrossDomain") !== "false";
    var retainCookies = config && config.get("retainCookies") !== "false";

    if (!und.isArray(startUrls)) {
        startUrls = [startUrls];
    }

    var origDir;

    suiteManager.clean();

    if (baseDir) {
        origDir = process.cwd();
        process.chdir(baseDir);
    }
    startUrls = resolveUrls(startUrls);

    testFiles = populateTestFiles(testsDir, []);

    if (testFiles.length === 0) {
        throw new Error("No tests found in folder: " + testsDir);
    }

    var done = function() {
        if (origDir) {
            process.chdir(origDir);
        }
        suiteManager.generateReport(reporter);
        if (callback) {
            callback();
        }
    };

    // :-( cannot think of another way to know when all the URLs have been spidered except to timeout
    timeout = timers.setTimeout(done, SPIDER_COMPLETED_TIMEOUT);

    startUrls.forEach(function(startUrl) {
        var spider = spiderModule({
            throwOnMissingRoute: failOnMissingRoute,
            throwOnNoResponse: failOnNoResponse,
            spiderCrossDomain: spiderCrossDomain,
            retainCookies: retainCookies,
            autoSpider: spiderOptions.AUTO.ANCHORS | spiderOptions.AUTO.LINKS |
                spiderOptions.AUTO.IMAGES | spiderOptions.AUTO.SCRIPTS,
            defaultHeaders: DEFAULT_HEADERS
        });

        spider
            .route(startUrl.host, "/*",
            function ($) {
                // Got a response that we can use so clear the timeout and restart it
                timers.clearTimeout(timeout);
                timeout = timers.setTimeout(done, SPIDER_COMPLETED_TIMEOUT);
                var payload = this;
                return executeMatchingTests(payload, $);
            })
            .get(startUrl.href, headerProvider)
            .log("error");
    });
};

/**
 * Iterate over all of the tests. Any test whose topic.urlPattern matches the url of the route of the payload request
 * is executed as part of the testsuite that is named after the test file in which the matching test was found.
 * @param {Object} payload a payload from spider
 * @param {Object} $ the $ from the spider response
 * @private
 */
var executeMatchingTests = function (payload, $) {

    var continueSpidering = true;
    var requestHref = payload.spider.currentUrl;
    findMatchingTopics(requestHref, testFiles, function(topicName, topic, testFile) {
        var topicTests = topic.tests;
        continueSpidering = determineContinueSpidering(topic);
        // The associated test only matches if the HTTP request used those headers - this is true even if there are
        // no headers in the topic because in that case the DEFAULT_HEADERS are used.
        var requestHeaders = payload.response.request.headers;
        var topicHeaders = und.extend(und.clone(DEFAULT_HEADERS), topic.requestHeaders);
        var headersMatch = spiderUtils.headersEqual(topicHeaders, requestHeaders);
        if (headersMatch) {
            for (var topicTest in topicTests) {
                if (topicTests.hasOwnProperty(topicTest)) {
                    var pathVariables = spiderUtils.determinePathVariableValues(payload.url.path, topic.urlPattern);
                    var testName = spiderUtils.replacePlaceholdersInString(topicTest, pathVariables);
                    topicTest = topicTests[topicTest];
                    var testDetails = {
                        testName: testName,
                        topicName: topicName,
                        suiteName: requestHref,
                        test: topicTest,
                        testFile: testFile,
                        spiderPayload: payload,
                        $: $,
                        pathVariables: pathVariables
                    };
                    suiteManager.runSuiteTest(testDetails);
                }
            }
        }
    });
    return continueSpidering;
};

var headerProvider = function (url) {
    var headerSets = [];
    findMatchingTopics(url, testFiles, function(topicName, topic) {
        var headers = topic.requestHeaders ? und.extend(und.clone(DEFAULT_HEADERS), topic.requestHeaders) :
            und.clone(DEFAULT_HEADERS);
        if (!spiderUtils.containsHeaders(headerSets, headers)) {
            headerSets.push(headers);
        }
    });

    return headerSets;
};

function findMatchingTopics(requestHref, testFiles, callback) {
    testFiles.forEach(function (testFile) {
        var topics = require(testFile).topics;
        var mixins = require(testFile).mixins;
        for (var topic in topics) {
            if (topics.hasOwnProperty(topic)) {
                var topicName = topic;
                topic = topics[topic];
                var pattern = spiderUtils.replacePlaceholdersWithWildcard(topic.urlPattern);
                if (requestHref.match(pattern)) {
                    addMixinsToTopic(topic, mixins);
                    callback(topicName, topic, testFile);
                }
            }
        }
    });
}

/**
 * Look for mixin includes within the topic and if there are any then replace the include with the corresponding
 * mixin.
 *
 * @param {Object} topic the testsuite topic
 * @param {Object} mixins the mixins object to use with the specified topic (i.e. they are both from the same test file)
 */
function addMixinsToTopic(topic, mixins) {
    var includes = topic.tests['@include'];
    if (mixins && includes) {
        includes = und.isArray(includes) ? includes : [includes];
        includes.forEach(function(include) {
            var mixin = mixins[include];
            if (!mixin) {
                throw new Error("Reference made to non-existing mixin: " + include);
            }
            und.extend(topic.tests, mixin);
        });
        if (!delete topic.tests['@include']) {
            throw new Error("Failed to delete @include from: " + topic.tests);
        }
    }
}

function determineContinueSpidering(topic) {
    var continueSpidering = topic.tests['@continueSpidering'];
    if (continueSpidering !== undefined) {
        // Remove the @continueSpidering directive from the set of tests
        if (!delete topic.tests['@continueSpidering']) {
            throw new Error("Failed to delete @continueSpidering from: " + topic.tests);
        }
    }
    return continueSpidering;
}

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
 * Given an array of url strings resolve each to a url object that includes protcol, host, port and absolute path. If
 * the url string does not include scheme, host, or port then the following defaults are used:
 *     protocol: http
 *     host: localhost
 *     port: 80
 *
 * @param {String []} urlStrings the url string to resolve
 * @return {Url []} an array of resolved url objects
 * @private
 */
function resolveUrls(urlStrings) {
    var urls = [];
    urlStrings.forEach(function(urlString) {
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
        urls.push(url);
    });
    return urls;
}
