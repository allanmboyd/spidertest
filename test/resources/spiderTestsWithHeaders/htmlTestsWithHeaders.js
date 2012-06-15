var should = require("should");

exports.topics = {
    "Common HTML Tests" : {
        urlPattern: "\.html$",
        tests: {
            "HTML responses should have a statusCode of 200": {
                assert: function (spiderPayload) {
                    should.equal(spiderPayload.response.statusCode, 200)
                }
            },
            "HTML responses should have a content type of text/html; charset=UTF-8": {
                assert: function (spiderPayload) {
                    should.equal("text/html; charset=UTF-8", spiderPayload.response.headers['content-type']);
                }
            },
            "The accept-language request header should not be ja-jp": {
                assert: function (spiderPayload) {
                    spiderPayload.response.request.headers["accept-language"].should.not.equal('ja-jp');
                }
            },
            "The user-agent request header should not be Android": {
                assert: function (spiderPayload) {
                    spiderPayload.response.request.headers["user-agent"].should.not.equal('Android');
                }
            }
        }
    },
    "Common HTML Tests with headers" : {
        urlPattern: "anotherPage.html",
        requestHeaders: {
            "accept-language": "ja-jp",
            "user-agent": "Android",
            "cookie": "helloCookie=hello; byeCookie=bye"
        },
        tests: {
            "The accept-language request header should be ja-jp": {
                assert: function (spiderPayload) {
                    should.equal("ja-jp", spiderPayload.response.request.headers["accept-language"]);
                }
            },
            "The user-agent request header should be Android": {
                assert: function (spiderPayload) {
                    should.equal("Android", spiderPayload.response.request.headers["user-agent"]);
                }
            },
            "There should be a cookie header in the request with that contains cookies 'helloCookie=hello' and 'byeCookie=bye'": {
                assert: function (spiderPayload) {
                    var cookieHeader = spiderPayload.response.request.headers["cookie"];
                    cookieHeader.should.include("helloCookie=hello");
                    cookieHeader.should.include("byeCookie=bye");
                }
            }
        }
    },
    "Index tests" : {
        urlPattern: "testIndex.html",
        tests: {
            "The first css reference should be a link to testCss/some.css": {
                assert: function (spiderPayload, $) {
                    var link = $("head").find("link")[0];
                    var linkHref = link.attribs.href;
                    linkHref.should.equal("testCss/some.css");
                }
            }
        }
    },
    "Specific cookie based test number 1: hello" : {
        urlPattern: "testIndex.html",
        requestHeaders: {
            "myCustomHeader": 'hello',
            "cookie": "greeting=hello"
        },
        tests: {
            "The request greeting cookie should be set to 'hello'": {
                assert: function (spiderPayload) {
                    var cookieHeader = spiderPayload.response.request.headers["cookie"];
                    cookieHeader.should.include("greeting=hello");
                    cookieHeader.should.not.include("greeting=ohaiyo");
                }
            }    
        }
    },
    "Specific cookie based test number 2: ohaiyo" : {
        urlPattern: "testIndex.html",
        requestHeaders: {
            "myCustomHeader": 'ohaiyo',
            "cookie": "greeting=ohaiyo"
        },
        tests: {
            "The request greeting cookie should be set to 'ohaiyo'": {
                assert: function (spiderPayload) {
                    var cookieHeader = spiderPayload.response.request.headers["cookie"];
                    cookieHeader.should.include("greeting=ohaiyo");
                    cookieHeader.should.not.include("greeting=hello");
                }
            }
        }
    },
    "When retain cookies config setting is true - which is the default" : {
        urlPattern: "//\.*/\.*/\.*$",
        tests: {
            "the server cookie named 'servercookie' should never be in the request path": {
                assert: function (spiderPayload) {
                    should.exist(spiderPayload.response.request.headers["cookie"]);
                }
            }
        }
    }
};
