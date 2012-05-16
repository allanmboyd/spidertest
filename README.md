SpiderTest
==========

Overview
--------

SpiderTest is NodeJS module designed for lazy people - like me - who prefer to have a machine not only run a bunch of
web tests but also to kind of implement them too.

For example my website might have lots of different pages with links to other pages
and resources like images, css, javascript - whatever. Assuming all of those pages and resources are accessible via
URLs from some starting page (e.g. the home page) then I would like to make sure that all of those URLs work and that
they return the correct headers in the response. I might also want to ensure that common features on every html page like
headers, footers and menus are in the page and as expected. There might a subset of pages that should have the same
content and I might want to check this is true. I might want to run some tests against CSS or Javascript content that
is accessed also.

Ideally I don't want to write the same tests multiple times for common features. Also, I don't really want to have
to keep checking that all my tests cover all the links available especially since someone else could be modifying the
site. I want the machine to do these things for me.

Finally, I want to have test reporting flexibility. I don't want my reporters to be coupled to the tests. I
would like to be able to write reporters that don't have to worry about running tests and I would like to
provide more than one if I want.

SpiderTest aims to provide these features. It takes as input a start URL and a path to a folder containing test definitions
(it's BDD by the way so tests can be nice and descriptive). If it gets a response from the start URL it
looks for any tests matching the URL and executes the ones that it finds. Then it looks at the response to find more
links that it can request. If it finds any then it requests them, gets a response and executes any matching tests and
so the cycle continues until there are no more URLs to test. Each matching test that it finds it associates with the
corresponding URL. By discovering URLs and pairing them up with tests SpiderTest could be said to be automating test
generation. The test results for each URL tested are encapsulated within a test suite result set.

SpiderTest reporters are event driven - or at least event driven in the way SAX parsers are event driven (I'm not saying
that reporters are SAX parsers btw just that they operate in the same way). When all the tests have been executed the
test results are iterated. Test results are structured as a hierarchy that comprises of test suites, topics and tests.
Each visited URL that has one or more associated tests defines a test suite. Within a test suite (i.e. a matched URL)
there may be multiple topics and each topic may contain multiple individual tests.

Each reporter implements an interface defined within __Reporter.js__ (this is documented below and in the code). The
reporter callback methods are invoked as the tests are iterated providing the necessary information to generated test
reports in a variety of formats at different levels of detail as required.


TODO
----

- Provide a means to add request headers to be specified for tests
- Expose more options
- Better support JSON and XML responses (e.g. like finding URLs in these docs and using them)
- Maybe support other kinds of HTTP request (other than GET)


Test Definition
---------------

Tests can use any third party assertion library (at least there are no deliberate restrictions). They
are defined as an exported javascript object named __topics__. The topics object is composed of
a collection of topics. Each topic has an associated collection of tests as well as some
additional attributes that determine things like the URL patterns against which to apply
the topic tests. Each test within a topic is composed of a test name (which can be descriptive)
and an associated function that performs the test. The test assert property is a function that receives a single
parameter called the spiderPayload.

Here is a very basic example:

    var should = require("should");
    exports.topics = {
        "Common HTTP Tests" : {
            urlPattern: "/",
            tests: {
                "HTTP responses should have a statusCode of 200": {
                    assert: function(spiderPayload) {
                        should.equal(spiderPayload.response.statusCode, 200)
                    }
                }
            }
        }
    }

The above test definition defines only a single topic with a single test - there can be
multiple of each within the topics object. The test asserts:

_For any URL that includes a "/" run the associated tests. In this case the associated test
is a single test that verifies that the HTTP status code of the response is equal to 200._

The name of the topic in the above example is __Common HTTP Tests___ and the name of the test
is __HTTP responses should have a statusCode of 200__.

The __urlPattern__ attribute specifies a regular expression to use to match URLs. Each matched
URL has the associated tests run against its response. A single URL may be matched multiple times
in which case all associated tests are run.

### Spider Payload ###

The Spider Payload is the object that is provided to each test assert function upon execution. It contains lots
of data concerning the response of the associated HTTP request. A sample payload is provided in the examples folder
as a full description is beyond the scope of this README. However, some of the more obviously useful properties
are listed below:

#### Response Headers ####

    spiderPayload.response.headers.<headerName>


Provide the values of HTTP response headers.

Examples:
    spiderPayload.response.headers['content-length']
    spiderPayload.response.headers['accept-language']
    spiderPayload.response.headers['content-type']

#### Request URL ####

    spiderPayload.url

Provide the URL of the associated HTTP request.

Examples:
    spiderPayload.url.host
    spiderPayload.url.href
    spiderPayload.url.path

#### Response Status ####

    spiderPayload.response.statusCode

Provide the HTTP response status code.

#### Response Body ####

    spiderPayload.response.body

Provide the entire response document as a string.

Installation
------------

    npm install spidertest

By default spidertest installs globally.


Usage
-----

Some examples:

1. Spider test a website using default options and the tests defined in the examples/tests folder:

    spidertest --testDir=/Users/aboyd/github/spiderTest/examples/tests --spiderStartUrl=http://subways.millionyearsold.com

2. Same as above but this time specify a the JUnitReporter

    spidertest --testDir=/Users/aboyd/github/spiderTest/examples/tests --spiderStartUrl=http://subways.millionyearsold.com --reporters=/Users/aboyd/github/spidertest/lib/reporters/JUnitReporter

Output of spidertest --help:

<pre><code>
Usage: spiderTest [configOption] (see spiderTest -h for more detail)

Options:
  --config              Path to a json configuration file defining custom
                        options. All command line options - except this one
                        and --help - will be used if present. Options
                        specified directly on the command line override file
                        loaded options.
  --failOnMissingRoute  Set to true if spidering should stop when a route to
                        an encountered link is not available
                                                             [default: "false"]
  --failOnNoResponse    Set to true if spidering should stop when a HTTP
                        request fails to get a response      [default: "false"]
  --help, -h            This message.
  --reporters           Comma separated list of paths to reporter.js Reporter
                        implementations for reporting test results.
                                  [default: "../lib/reporters/ConsoleReporter"]
  --reporterOptions     String of options passed into the createReporter()
                        Reporter function. It is up to the reporter to
                        determine what to do with it.
  --spiderCrossDomain   Allow spidering to continue across different domains
                                                             [default: "false"]
  --spiderStartUrl      The full http url from which to start spidering.
  --testDir             Absolute path to folder containing javascript test
                        definitions

</pre></code>

Reporters
---------

Out of the box SpiderTest comes with 3 reporters:

- ConsoleReporter : output to the console in formatted text (this is the default reporter)
- JUnitReporter : output to the console all test results as a single XML document in JUnit format
- MultiFileJUnitReporter : output to the file system each test suite result set as an individual file

Any of these (or all of them) can be specified as the reporters for a spidertest run. If no reporter is specified
as an option then the ConsoleReporter is used.

New reporters can be created either by extended/editing any of the existing reporters or extending Reporter.js.

Reporters are specified using the __reporters__ option which should be a comma separated string of paths to the
reporter modules to use. See spidertest --help for details.

The Reporter API is described below.

Reporter
--------

Defines an interface (and abstraction) that should be implemented by SpiderTest Reporter implementations to report
on the results of a SpiderTest test run.

Reporter instances are provided to a 'spidertest' invocation via command line or file based options. Each Reporter
instance will have its callback methods invoked when the reporting phase of SpiderTest kicks in subsequent to
completion of all test executions.

The reporting phase of SpiderTest iterates over all tests result components in the same way a SAX Parser iterates
over all the nodes of an XML document. Test result components consist of: testsuites, testsuite, topic, test,
testSuccess, testFailure, testError. These form a hierarchy with testsuites at the root.

When a test result component is encountered during the results phase of SpiderTest one or more corresponding
callback methods within each provided reporter are invoked. These callback invocations provide the reporter with
the means to report on the test results.

Each Reporter implementation should extend this Reporter class and override those methods that it needs to perform
its required reporting function. There is no requirement to override every method.


###Reporter.prototype.suitesStart = function ()###

Invoked at the beginning of the reporting phase of SpiderTest. Indicates the start of the reporting phase.
* * *


###Reporter.prototype.suitesEnd = function(testCount, successCount, failedCount, errorCount, suitesTime)###

The final method to be invoked during the reporting phase of SpiderTest. Indicates the end of the reporting phase.

####Parameters####

* testCount *Number* the combined total number of tests executed
* successCount *Number* the combined total number of tests that passed
* failedCount *Number* the combined total number of tests that failed
* errorCount *Number* the combined total number of errors that were generated by tests
* suitesTime *Number* the combined total time in seconds that it took to execute tests. (Note that this does not include
the time that it takes to obtain responses from a web site - just the time for test execution against the spidered
responses.)
* * *


###Reporter.prototype.suiteStart = function(suiteName, suiteDescription, testCount, successCount, failedCount, errorCount, suiteTime)###

Invoked when a new test suite is encountered.
####Parameters####

* suiteName *String* name of the suite. This is the URL that is associated the the tests within the suite.
* suiteDescription *String* description of the suite. This is available if defined within the test definition.
* testCount *Number* the number of tests in the suite
* successCount *Number* the number of tests that passed in the suite
* failedCount *Number* the number of tests that failed in the suite
* errorCount *Number* the number of tests that generated an error (to be clear this refers to errors during
test execution as defined within the tests definitions and not to errors encountered spidering URLs)
* suiteTime *Number* the time in seconds that it took to execute the tests in the test suite. (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered responses within the suite.)
* * *


###Reporter.prototype.suiteEnd = function()###

Invoked at the end of a testsuite. Merely indicates that a transition to the next suite is about to occur having
invoked all the callbacks for all the tests within the current test suite.
* * *


###Reporter.prototype.topicStart = function(topicName, topicDescription, testCount, successCount, failedCount, errorCount, topicTime)###

Invoked for each topic within a test suite. A topic allows several related tests to be grouped together.
####Parameters####

* topicName *String* the topic name as defined by the associated test definition
* topicDescription *String* the description of the topic as defined by the associated test definition
* testCount *Number* the number of tests in the topic
* successCount *Number* the number of tests that passed in the topic
* failedCount *Number* the number of tests that failed in the topic
* errorCount *Number* the number of topic tests that generated an error (to be clear this refers to errors during
test execution as defined within the tests definitions and not to errors encountered spidering URLs)
* topicTime *Number* the time in seconds that it took to execute the tests in the topic. (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered responses within the topic.)
* * *


###Reporter.prototype.topicEnd = function()###

Invoked at the end of a topic. Merely indicates that a transition to the next topic is about to occur having
invoked all the callbacks for all the tests within the current topic.
* * *


###Reporter.prototype.testStart = function(testName, testTime, testFile)###

Invoked for each test within a topic.
####Parameters####

* testName *String* the name of the test as defined by the associated test definition
* testTime *Number* the time in seconds that it took to execute the test. (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered response.)
* testFile *String* the name of the file containing the associated test definition from which the test was drawn
* * *


###Reporter.prototype.testEnd = function()###

Invoked at the end of a test. Merely indicates that a transition to the next test is about to occur having
invoked all the callbacks associated with the current test.
* * *


###Reporter.prototype.testSuccess = function(testName, testTime, testFile)###

Invoked for each successful test.
####Parameters####

* testName *String* the name of the test as defined by the associated test definition
* testTime *Number* the time in seconds that it took to execute the test  (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered response.)
* testFile *String* the name of the file containing the associated test definition from which the test was drawn
* * *


###Reporter.prototype.testFailure = function(testName, error, testTime, testFile)###

Invoked for each failed test.
####Parameters####

* testName *String* the name of the test as defined by the associated test definition
* testTime *Number* the time in seconds that it took to execute the test  (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered response.)
* testFile *String* the name of the file containing the associated test definition from which the test was drawn
* * *


###Reporter.prototype.testError = function(testName, error, testTime, testFile)###

Invoked for test that resulted in an error (to be clear this refers to errors during
test execution as defined within the tests definitions and not to errors encountered spidering URLs)
####Parameters####

* testName *String* the name of the test as defined by the associated test definition
* testTime *Number* the time in seconds that it took to execute the test  (Note that this does not
include the time that it takes to obtain responses from a web site - just the time for test execution against the
spidered response.)
* testFile *String* the name of the file containing the associated test definition from which the test was drawn
* * *


###module.exports = function ()###

Reporter implementations should inherit from the Reporter my requiring Reporter and invoking:
     new Reporter();
* * *


createReporter
--------------

###exports.createReporter = function (options)###

Reporter implementations should implement this method to return a new instance of their Reporter.
####Parameters####

* options *String* to pass into the reporter. It is up to the reporter to determine what to do with these
options.

####Returns####

*Reporter* a new instance of Reporter that would be expected to override at least some of the Reporter
prototype methods.
* * *



