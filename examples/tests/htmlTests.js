var should = require("should");

exports.tests = {
    "Common HTML Tests" : {
        urlPattern: "/",
        tests: {
            "HTML responses should have a statusCode of 200": function(spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 200)
            },
            "HTML responses should have a content type of text/html": function (spiderPayload) {
                spiderPayload.response.headers['content-type'].should.include("text/html");
            }
        }
    }
};
