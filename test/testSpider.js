var express = require("express");
var should = require("should");
var spider = require("../lib/spider")();
var url = require("url");

process.on('uncaughtException', function (err) {
    console.log(err);
    process.exit(-1);
});

var server = express.createServer();

server.configure(function() {
//    server.use(express.logger());
    server.use(server.router);
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
    testHappyHTMLManualSpider: function (test) {
        var routeCallback = function (payload, $) {
            basicHappyResponseChecks(payload, $);
            basicHappyHTMLChecks(payload, $);
            spiderAnchors($);
        };
        runSpiderTests("/testIndex.html", routeCallback, 3, test.done);
    },
    testHappyCSSManualSpider: function (test) {
        var routeCallback = function (payload, $) {
            basicHappyResponseChecks(payload, $);
            if (payload.url.href.indexOf(".css") !== -1) {
                payload.response.body.should.include("background-color");
                "text/css; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
            }
            spiderCssLinks($);

        };
        runSpiderTests("/testIndex.html", routeCallback, 2, test.done);
    },
    testHappyJavascriptManualSpider: function (test) {
        var routeCallback = function (payload, $) {
            basicHappyResponseChecks(payload, $);
            if (payload.url.href.indexOf(".js") !== -1) {
                payload.response.body.should.include("strict");
                "application/javascript".should.equal(payload.response.headers["content-type"]);
            }
            spiderJsLinks($);

        };
        runSpiderTests("/testIndex.html", routeCallback, 2, test.done);
    },
    testHappyImgManualSpider: function (test) {
        var routeCallback = function (payload, $) {
            basicHappyResponseChecks(payload, $);
            if (payload.url.href.indexOf(".jpg") !== -1) {
                "image/jpeg".should.equal(payload.response.headers["content-type"]);
            }
            spiderImgLinks($);

        };
        runSpiderTests("/testIndex.html", routeCallback, 2, test.done);
    },
    testContentNotFound: function (test) {
        var routeCallback = function (payload) {
            payload.response.statusCode.should.equal(404);
            test.done();
        };
        runSpiderTests("/nopage", routeCallback);
    },
    testNoRoute: function (test) {
       spider.log("debug").get("http://hello");
       test.done();
    }
};

function runSpiderTests(startPage, routeCallback, spiderCount, done) {
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
        .get("http://localhost:" + serverPort + startPage)
        .log("error");
}

var spiderAnchors = function($) {
    $("a").each(function() {
        callSpider($, this);
    });
};

var spiderCssLinks = function ($) {
    $("link").each(function() {
        callSpider($, this);
    });
};

var spiderJsLinks = function ($) {
    $("script").each(function() {
        callSpider($, this, "src");
    });
};

var spiderImgLinks = function ($) {
    $("img").each(function() {
        callSpider($, this, "src");
    });
};

var basicHappyResponseChecks = function (payload, $) {
    should.exist(payload.response);
    should.exist(payload.response.statusCode);
    payload.response.statusCode.should.equal(200);
    should.exist(payload.response.body);
    should.exist($);
};

var basicHappyHTMLChecks = function (payload) {
    payload.response.body.should.include("head");
    payload.response.body.should.include("body");
    "text/html; charset=UTF-8".should.equal(payload.response.headers["content-type"]);
};

function callSpider($, doc, attr) {
    attr = attr ? attr : "href";
    var href = $(doc).attr(attr);
    href = url.resolve("http://localhost:" + serverPort, href);
    spider.get(href);
}
