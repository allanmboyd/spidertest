var should = require("should");

exports.tests = {
    "Common HTTP Tests" : {
        urlPattern: "/",
        tests: {
            "HTML responses should have a statusCode of 200": function(spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 200)
            }
        }
    },
    "Image Tests (gif)": {
        urlPattern: "\.gif$",
        tests: {
            "GIF responses should have a content type of image/gif": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("image/gif");
            }
        }
    },
    "Image Tests (jpg)": {
        urlPattern: "\.jpg$",
        tests: {
            "JPEG responses should have a content type of image/jpg": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("image/jpeg");
            }
        }
    },
    "Image Tests (png)": {
        urlPattern: "\.png$",
        tests: {
            "PNG responses should have a content type of image/png": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("image/png");
            }
        }
    },
    "Common Map HTML Tests": {
        urlPattern: "/map/",
        tests: {
            "HTML responses should have a content type of text/html": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("text/html");
            }
        }
    },
    "Common CSS Tests": {
        urlPattern: "\.css$",
        tests: {
            "CSS responses should have a content type of text/css": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("text/css");
            }
        }
    },
    "Common Javascript Tests": {
        urlPattern: "\.js$",
        tests: {
            "Javascript responses should have a content type of application/javascript": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("application/javascript");
            }
        }
    }
};
