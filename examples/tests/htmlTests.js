var should = require("should");

// todo add suite metadata - e.g. a suites description or even one based on patterns.
exports.topics = {
    "Common HTTP Tests" : {
        urlPattern: "/",
        tests: {
            "HTTP responses should have a statusCode of 200": {
                assert: function(spiderPayload) {
                    should.equal(spiderPayload.response.statusCode, 200)
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
    "Common HTTP Tests With Headers" : {
        urlPattern: "/",
        requestHeaders: {
            "accept-language": "ja-jp",
            "user-agent": "Android"
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
            }
        }
    },
    "Image Tests (gif)": {
        urlPattern: "\.gif$",
        tests: {
            "GIF responses should have a content type of image/gif": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("image/gif");
                }
            }
        }
    },
    "Image Tests (jpg)": {
        urlPattern: "\.jpg$",
        tests: {
            "JPEG responses should have a content type of image/jpg": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("image/jpeg");
                }
            }
        }
    },
    "Image Tests (png)": {
        urlPattern: "\.png$",
        tests: {
            "PNG responses should have a content type of image/png": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("image/png");
                }
            }
        }
    },
    "Common Map HTML Tests": {
        urlPattern: "/map/",
        tests: {
            "HTML responses should have a content type of text/html": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("text/html");
                }
            }
        }
    },
    "Common CSS Tests": {
        urlPattern: "\.css$",
        tests: {
            "CSS responses should have a content type of text/css": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("text/css");
                }
            }
        }
    },
    "Common Javascript Tests": {
        urlPattern: "\.js$",
        tests: {
            "Javascript responses should have a content type of application/javascript": {
                assert: function (spiderPayload) {
                    spiderPayload.response.headers['content-type'].should.include("application/javascript");
                }
            }
        }
    }
};
