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




TDB


spiderPayload:

{ params: {},
  splats: [ 'testJS/some.js' ],
  route: '/*',
  fn: [Function],
  spider:
   { autoSpiderAll: 0,
     throwOnMissingRoute: true,
     maxSockets: 4,
     userAgent: 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7',
     cache: {},
     pool: { maxSockets: undefined },
     options: { throwOnMissingRoute: true, autoSpider: 15 },
     currentUrl: 'http://localhost:53031/testJS/some.js',
     routers: { 'localhost:53031': [Object] },
     urls:
      [ 'http://localhost:53031/testIndex.html',
        'http://localhost:53031/anotherPage.html',
        'http://localhost:53031/testFolder/yetAnotherPage.html',
        'http://localhost:53031/testImages/original.jpg',
        'http://localhost:53031/testCss/some.css',
        'http://localhost:53031/testJS/some.js' ],
     _events: { log: [Function] } },
  response:
   { socket:
      { _handle: [Object],
        _pendingWriteReqs: 0,
        _flags: 0,
        _connectQueueSize: 0,
        destroyed: false,
        bytesRead: 326,
        bytesWritten: 428,
        allowHalfOpen: undefined,
        _connecting: false,
        writable: true,
        _events: [Object],
        _httpMessage: [Object],
        ondrain: [Function],
        ondata: [Function],
        onend: [Function],
        _connectQueue: null,
        readable: true },
     connection:
      { _handle: [Object],
        _pendingWriteReqs: 0,
        _flags: 0,
        _connectQueueSize: 0,
        destroyed: false,
        bytesRead: 326,
        bytesWritten: 428,
        allowHalfOpen: undefined,
        _connecting: false,
        writable: true,
        _events: [Object],
        _httpMessage: [Object],
        ondrain: [Function],
        ondata: [Function],
        onend: [Function],
        _connectQueue: null,
        readable: true },
     httpVersion: '1.1',
     complete: true,
     headers:
      { 'x-powered-by': 'Express',
        date: 'Tue, 20 Mar 2012 09:12:18 GMT',
        'cache-control': 'public, max-age=0',
        'last-modified': 'Mon, 27 Feb 2012 19:45:22 GMT',
        etag: '"37-1330371922000"',
        'content-type': 'application/javascript',
        'accept-ranges': 'bytes',
        'content-length': '37',
        connection: 'keep-alive' },
     trailers: {},
     readable: false,
     url: '',
     method: null,
     statusCode: 200,
     client:
      { _handle: [Object],
        _pendingWriteReqs: 0,
        _flags: 0,
        _connectQueueSize: 0,
        destroyed: false,
        bytesRead: 326,
        bytesWritten: 428,
        allowHalfOpen: undefined,
        _connecting: false,
        writable: true,
        _events: [Object],
        _httpMessage: [Object],
        ondrain: [Function],
        ondata: [Function],
        onend: [Function],
        _connectQueue: null,
        readable: true },
     httpVersionMajor: 1,
     httpVersionMinor: 1,
     upgrade: false,
     _events: { end: [Object], close: [Object], data: [Function] },
     request:
      { readable: true,
        writable: true,
        headers: [Object],
        pool: [Object],
        callback: [Function],
        dests: [],
        __isRequestRequest: true,
        _callback: [Function],
        uri: [Object],
        _redirectsFollowed: 0,
        maxRedirects: 10,
        followRedirect: true,
        followAllRedirects: false,
        redirects: [],
        setHost: true,
        originalCookieHeader: undefined,
        _jar: undefined,
        port: '53031',
        host: 'localhost',
        clientErrorHandler: [Function],
        _events: [Object],
        path: '/testJS/some.js',
        httpModule: [Object],
        agentClass: [Object],
        agent: [Object],
        _started: true,
        method: 'GET',
        href: 'http://localhost:53031/testJS/some.js',
        defaultPort: 80,
        req: [Object],
        ntick: true,
        response: [Circular],
        _destdata: true,
        _ended: true },
     body: '(function () {\n    "use strict"\n}());' },
  url:
   { protocol: 'http:',
     slashes: true,
     host: 'localhost:53031',
     port: '53031',
     hostname: 'localhost',
     href: 'http://localhost:53031/testJS/some.js',
     pathname: '/testJS/some.js',
     path: '/testJS/some.js' } }