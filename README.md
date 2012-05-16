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

- Provide a means to all request headers to be specified for tests
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

    For any URL that includes a "/" run the associated tests. In this case the associated test
    is a single test that verifies that the HTTP status code of the response is equal to 200.

The name of the topic in the above example is __Common HTTP Tests___ and the name of the test
is __HTTP responses should have a statusCode of 200__.

The __urlPattern__ attribute specifies a regular expression to use to match URLs. Each matched
URL has the associated tests run against its response. A single URL may be matched multiple times
in which case all associated tests are run.

*** Spider Payload ***

The Spider Payload is the object that is provided to each test assert function upon execution. It contains lots
of data concerning the response of the associated HTTP request. A sample payload is provided in the examples folder
as a full description is beyond the scope of this README. However, some of the more obviously useful properties
are listed below:

**** Response Headers ****

    spiderPayload.response.headers.<headerName>


Provide the values of HTTP response headers.

Examples:
    spiderPayload.response.headers['content-length']
    spiderPayload.response.headers['accept-language']
    spiderPayload.response.headers['content-type']

**** Request URL ****

    spiderPayload.url

Provide the URL of the associated HTTP request.

Examples:
    spiderPayload.url.host
    spiderPayload.url.href
    spiderPayload.url.path

**** Response Status ****

    spiderPayload.response.statusCode

Provide the HTTP response status code.

**** Response Body ****

    spiderPayload.response.body

Provide the entire response document as a string.

