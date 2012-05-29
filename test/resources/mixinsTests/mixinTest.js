var should = require("should");

/**
 * Define some mixins.
 */
exports.mixins = {
    commonHTMLTests: {
        "HTML responses should have a statusCode of 200": {
            assert: function (spiderPayload) {
                should.equal(spiderPayload.response.statusCode, 200)
            }
        },
        "HTML responses should have a content type of text/html; charset=UTF-8": {
            assert: function (spiderPayload) {
                should.equal("text/html; charset=UTF-8", spiderPayload.response.headers['content-type']);
            }
        }
    },
    headerTests: {
        "There should be a header section in the page": {
            assert: function (spiderPayload, $) {
                should.exist($('.header'));
            }
        }
    }
};

/**
 * Define the topics whose tests may reference one or more mixins.
 */
exports.topics = {
    "Index Page Tests" : {
        urlPattern: "testIndex.html",
        tests: {                                                // specify multiple mixins for the tests
            '@include': ['commonHTMLTests', 'headerTests']
        }
    },
    "Another Page Tests" : {
        urlPattern: "anotherPage.html",
        tests: {                                                // include multiple mixins and an inline test
            '@include': ['commonHTMLTests', 'headerTests'],
            'some test': {
                assert: function() {
                    should.equal(1, 1);
                }
            }
        }
    },
    "Yet Another Page Tests": {
        urlPattern: "yetAnotherPage.html",
        tests: {                                                // specify a single mixin for the tests
            '@include': 'commonHTMLTests'
        }
    }
};