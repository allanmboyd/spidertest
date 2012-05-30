var should = require("should");

exports.topics = {
    "Tests with URL path substitutions": {
        urlPattern: "/:parentFolder/yetAnotherPage.html",
        tests: {
            "The parent folder should be :parentFolder": {
                assert: function(spiderPayload, $, pathVariables) {
                    should.equal('testFolder', pathVariables.parentFolder);
                }
            }
        }
    }
};