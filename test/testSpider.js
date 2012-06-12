var async = require("async");
var errors = require("../lib/errors");
var express = require("express");
var should = require("should");
var spiderOptions = require("../lib/spiderOptions");
var spiderModule = require("../lib/spider");
var manualSpider = spiderModule({throwOnMissingRoute: true});
var autoSpiderAll = spiderModule({
    throwOnMissingRoute: true,
    autoSpider: spiderOptions.AUTO.ANCHORS | spiderOptions.AUTO.LINKS | spiderOptions.AUTO.IMAGES | spiderOptions.AUTO.SCRIPTS
});
var url = require("url");

process.on('uncaughtException', function (err) {
    console.log(err);
    process.exit(-1);
});

var server = express.createServer();

server.configure(function() {
//    server.use(express.logger());
    server.use(server.router);
    server.use(express.cookieParser());
    server.use(function(req, res, next) {
        for (var cookie in req.cookies) {
            if (req.cookies.hasOwnProperty(cookie) && cookie !== 'servercookie') {
                res.cookie(cookie, req.cookies[cookie]);
            }
        }
        if (!res.header['set-cookie']) {
            res.cookie('servercookie', 'hello');
        }
        next();
    });
    server.use(express["static"]("test/resources"));
});

var serverPort;

module.exports = {
    setUp: function (callback) {
        server.listen();
        serverPort = server.address().port;
        callback();
    },
    tearDown: function (callback) {
        server.close();
        callback();
    },
    testServerCookiesRetained: function (test) {
        var serverCookie = "servercookie=hello";
        var cookieOnAllRequests = function (payload) {
            var requestHeaders = payload.response.request.headers;
            var responseHeaders = payload.response.headers;
            should.exist(requestHeaders);
            should.exist(responseHeaders);
            if (payload.url.path.indexOf("testIndex.html") !== -1) {
                should.not.exist(requestHeaders.cookie);
            } else {
                should.exist(requestHeaders.cookie);
                requestHeaders.cookie.should.equal(serverCookie,
                    "Expected to see response cookie retained in the request for " + payload.url.href);
                responseHeaders['set-cookie'][0].should.equal(serverCookie, "Expected to see the default cookie in the response");
            }
        };

        function runTest(next) {
            var spider = spiderModule({
                throwOnMissingRoute: true,
                autoSpider: spiderOptions.AUTO.ANCHORS,
                retainCookies: true
            });
            runSpiderTests(spider, "/testIndex.html", cookieOnAllRequests, 3, next);
        }

        async.series([
            runTest,
            runTest // run twice to test for idempotency
        ], test.done);
    },
    testServerCookiesNotRetained: function (test) {
        var noCookies = function(payload) {
            var requestHeaders = payload.response.request.headers;
            var responseHeaders = payload.response.headers;
            should.exist(requestHeaders);
            should.exist(responseHeaders);
            should.not.exist(requestHeaders.cookie);
            should.exist(responseHeaders['set-cookie']);
        };

        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.ANCHORS,
            retainCookies: false
        });
        runSpiderTests(spider, "/testIndex.html", noCookies, 3, test.done);
    },
    testServerCookiesRetainedWithRequestCookies: function (test) {
        var serverCookie = "servercookie=hello";
        var clientCookie = "clientcookie=hello";

        var verifyCookies = function (payload, $) {
            var requestHeaders = payload.response.request.headers;
            var responseHeaders = payload.response.headers;
            should.exist(requestHeaders);
            var requestCookies = requestHeaders.cookie;
            should.exist(requestCookies);
            should.exist(responseHeaders);
            var responseCookies = responseHeaders['set-cookie'];
            should.exist(responseCookies);
            responseCookies.should.include(serverCookie, "The response should always include the server cookie");
            if (payload.url.path.indexOf("testIndex.html") !== -1) {
                requestCookies.should.not.include(serverCookie, "There should be no server cookie because we have " +
                    "yet to make a request");
                responseCookies.should.include(clientCookie, "Expected client cookie here because the header " +
                    "provider sets it");
            } else {
                requestCookies.should.include(serverCookie, "Expected the server cookie from the response to be " +
                    "retained in the request");
                responseCookies.should.include(clientCookie, "Expected the client cookie to be here because it " +
                    "should be retained from the server response");
            }
        };

        var indexHeaderProvider = function(url) {
            var headers = [];
            if (url && url.indexOf("testIndex.html") !== -1) {
                headers = [
                    {
                        cookie: clientCookie
                    }
                ];
            }
            return headers;
        };

        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.ANCHORS,
            retainCookies: true
        });
        runSpiderTests(spider, "/testIndex.html", verifyCookies, 3, test.done, indexHeaderProvider);

    },
    testServerCookiesNotRetainedWithRequestCookies: function (test) {
        var serverCookie = "servercookie=hello";
        var clientCookie = "clientcookie=hello";

        var verifyCookies = function (payload, $) {
            var requestHeaders = payload.response.request.headers;
            var responseHeaders = payload.response.headers;
            should.exist(requestHeaders);
            var requestCookies = requestHeaders.cookie;
            should.exist(responseHeaders);
            var responseCookies = responseHeaders['set-cookie'];
            should.exist(responseCookies);
            responseCookies.should.include(serverCookie, "The response should always include the server cookie");
            if (payload.url.path.indexOf("testIndex.html") !== -1) {
                should.exist(requestCookies);
                requestCookies.should.include(clientCookie, "Expected client cookie in the request because the header " +
                    "provider sets it");
                responseCookies.should.include(clientCookie, "Expected client cookie in the response because the header " +
                    "provider sets it");
                requestCookies.should.not.include(serverCookie, "The request should never include the server cookie " +
                    "because no cookies are retained");
            } else {
                should.not.exist(requestCookies);
                responseCookies.should.not.include(clientCookie, "There should be no client cookie here because" +
                    " it is not set by the header provider for this request and is not retained");
            }
        };

        var indexHeaderProvider = function(url) {
            var headers = [];
            if (url && url.indexOf("testIndex.html") !== -1) {
                headers = [
                    {
                        cookie: clientCookie
                    }
                ];
            }
            return headers;
        };

        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.ANCHORS,
            retainCookies: false
        });
        runSpiderTests(spider, "/testIndex.html", verifyCookies, 3, test.done, indexHeaderProvider);
    },
    testHTMLManualSpider: function (test) {
        var spider = manualSpider;
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            basicHTMLChecks(payload, $);
            spiderAnchors(spider, $);
        };
        runSpiderTests(spider, "/testIndex.html", routeCallback, 3, test.done);
    },
    testCSSManualSpider: function (test) {
        var spider = manualSpider;
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".css") !== -1) {
                payload.response.body.should.include("background-color");
                "text/css; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
            }
            spiderCssLinks(spider, $);

        };
        runSpiderTests(spider, "/testIndex.html", routeCallback, 2, test.done);
    },
    testJavascriptManualSpider: function (test) {
        var spider = manualSpider;
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".js") !== -1) {
                payload.response.body.should.include("strict");
                "application/javascript".should.equal(payload.response.headers["content-type"]);
            }
            spiderJsLinks(spider, $);

        };
        runSpiderTests(spider, "/testIndex.html", routeCallback, 2, test.done);
    },
    testImgManualSpider: function (test) {
        var spider = manualSpider;
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".jpg") !== -1) {
                "image/jpeg".should.equal(payload.response.headers["content-type"]);
            }
            spiderImgLinks(spider, $);

        };
        runSpiderTests(spider, "/testIndex.html", routeCallback, 2, test.done);
    },
    testContentNotFound: function (test) {
        var routeCallback = function (payload) {
            payload.response.statusCode.should.equal(404);
            test.done();
        };
        runSpiderTests(manualSpider, "/nopage", routeCallback);
    },
    testNoHostRoute: function (test) {
        try {
            manualSpider.get("http://hello");
            should.fail("Expected a NO_ROUTES_FOR_HOST error");
        } catch (error) {
            if (error.name !== errors.NO_ROUTES_FOR_HOST.name) {
                console.log(error.stack);
                error.name.should.equal(errors.NO_ROUTES_FOR_HOST.name);
            }
            test.done();
        }
    },
    testNoPathRoute: function (test) {
        try {
            manualSpider
                .route("localhost:" + serverPort, "/somepath",
                function() {
                    should.fail("This should not be called");
                })
                .get("http://localhost:" + serverPort + "/noroute");
            should.fail("Expected a NO_ROUTES_FOR_PATH error");
        } catch (error) {
            if (error.name !== errors.NO_ROUTES_FOR_PATH.name) {
                console.log(error.stack);
                error.name.should.equal(errors.NO_ROUTES_FOR_PATH.name);
            }
            test.done();
        }
    },
    testAnchorsAutoSpider: function (test) {
        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.ANCHORS
        });
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);

            if (payload.url.href.indexOf(".html") !== -1) {
                basicHTMLChecks(payload, $);
            }
        };
        runSpiderTests(spider, "/testIndex.html", routeCallback, 3, test.done);
    },
    testCSSAutoSpider: function (test) {
        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.LINKS
        });
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".css") !== -1) {
                payload.response.body.should.include("background-color");
                "text/css; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
                test.done();
            }
        };
        runSpiderTests(spider, "/testIndex.html", routeCallback);
    },
    testJavascriptAutoSpider: function (test) {
        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.SCRIPTS
        });

        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".js") !== -1) {
                payload.response.body.should.include("strict");
                "application/javascript".should.equal(payload.response.headers["content-type"]);
                test.done();
            }
        };
        runSpiderTests(spider, "/testIndex.html", routeCallback);
    },
    testImgAutoSpider: function (test) {
        var spider = spiderModule({
            throwOnMissingRoute: true,
            autoSpider: spiderOptions.AUTO.IMAGES
        });
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".jpg") !== -1) {
                "image/jpeg".should.equal(payload.response.headers["content-type"]);
                test.done();
            }
        };
        runSpiderTests(spider, "/testIndex.html", routeCallback);
    },
    testAutoSpiderAll: function (test) {
        var routeCallback = function (payload, $) {
            basicResponseChecks(payload, $);
            if (payload.url.href.indexOf(".jpg") !== -1) {
                "image/jpeg".should.equal(payload.response.headers["content-type"]);
            }
            if (payload.url.href.indexOf(".js") !== -1) {
                payload.response.body.should.include("strict");
                "application/javascript".should.equal(payload.response.headers["content-type"]);
            }
            if (payload.url.href.indexOf(".css") !== -1) {
                payload.response.body.should.include("background-color");
                "text/css; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
            }
            if (payload.url.href.indexOf(".html") !== -1) {
                basicHTMLChecks(payload, $);
            }
        };
        runSpiderTests(autoSpiderAll, "/testIndex.html", routeCallback, 5, test.done);
    }
};

function runSpiderTests(spider, startPage, routeCallback, spiderCount, done, requestHeaderProvider) {
    spider
        .route("localhost:" + serverPort, "/*",
        function ($) {
            var payload = this;
            if (routeCallback) {
                routeCallback(payload, $);
            }
            spiderCount -= 1;
            if (spiderCount === 0 && done) {
                done();
            }
        })
        .get("http://localhost:" + serverPort + startPage, requestHeaderProvider)
        .log("error");
}

var spiderAnchors = function(spider, $) {
    $("a").each(function() {
        callSpider(spider, $, this);
    });
};

var spiderCssLinks = function (spider, $) {
    $("link").each(function() {
        callSpider(spider, $, this);
    });
};

var spiderJsLinks = function (spider, $) {
    $("script").each(function() {
        callSpider(spider, $, this, "src");
    });
};

var spiderImgLinks = function (spider, $) {
    $("img").each(function() {
        callSpider(spider, $, this, "src");
    });
};

var basicResponseChecks = function (payload, $) {
    should.exist(payload.response);
    should.exist(payload.response.statusCode);
    payload.response.statusCode.should.equal(200);
    should.exist(payload.response.body);
    should.exist($);
};

var basicHTMLChecks = function (payload) {
    payload.response.body.should.include("head");
    payload.response.body.should.include("body");
    "text/html; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
};

function callSpider(spider, $, tag, attr) {
    attr = attr ? attr : "href";
    var href = $(tag).attr(attr);
    if (href) {
        href = url.resolve("http://localhost:" + serverPort, href);
        spider.get(href);
    }
}
