var should = require("should");

exports.topics = {
    "Index tests" : {
        urlPattern: "testIndex.html",
        tests: {
            '@continueSpidering': false,
            "The first css reference should be a link to testCss/some.css": {
                assert: function (spiderPayload, $) {
                    var link = $("head").find("link")[0];
                    var linkHref = link.attribs.href;
                    linkHref.should.equal("testCss/some.css");
                }
            }
        }
    },
    "Another Page tests" : {
        urlPattern: "anotherPage.html",
        tests: {
            "Ensure that when spidering is stopped be a previous test, that spidering does indeed stop": {
                assert: function () {
                    ("This test should not be executed").should.not.be.ok;
                }
            }
        }
    }
};
