var should = require("should");

exports.tests = {
    "Common HTML Tests" : {
        urlPattern: "\.html$",
        tests: {
            "HTML responses should have a statusCode of 200": function(spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 200)
            },
            "HTML responses should have a content type of text/html; charset=UTF-8": function (spiderPayload) {
                should.equal("text/html; charset=UTF-8", spiderPayload.response.headers['content-type']);
            }
        }
    }
};
