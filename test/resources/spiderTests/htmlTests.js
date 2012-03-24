var should = require("should");

exports.tests = {
    "Common HTML Tests" : {
        urlPattern: "\.html$",
        tests: {
            "HTML responses should have a statusCode of 200": function (spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 400)
            },
            "HTML responses should have a content type of text/html; charset=UTF-8": function (spiderPayload) {
                should.equal("text/html; charset=UTF-8", spiderPayload.response.headers['content-type']);
            }
        }
    },
    "Index tests" : {
        urlPattern: "testIndex.html",
        tests: {
            "The first css reference should be a link to testCss/some.css": function (spiderPayload, $) {
                var link = $("head").find("link")[0];
                var linkHref = link.attribs.href;
                linkHref.should.equal("testCss/some.css");
            }
        }
    }
};
