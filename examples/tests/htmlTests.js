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
