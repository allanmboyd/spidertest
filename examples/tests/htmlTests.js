var should = require("should");

exports.tests = {
    "Common HTML Tests" : {
        urlPattern: "\.html$",
        tests: {
            "All HTML responses should have a statusCode of 200": function(spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 200)
            }
        }
    }
};
