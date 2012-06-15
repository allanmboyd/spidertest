var should = require("should");

exports.topics = {
    "When retain cookies config setting is set to false" : {
        urlPattern: "/",
        requestHeaders: {
            "customHeader": "do not retain cookies"
        },
        tests: {
            "the server cookie named 'servercookie' should never be in the request path": {
                assert: function (spiderPayload) {
                    should.not.exist(spiderPayload.response.request.headers["cookie"]);
                }
            }
        }
    }
};