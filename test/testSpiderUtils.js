var und = require('underscore');
var should = require("should");
var utils = require("../lib/spiderUtils");

exports.testObjectify = function(test) {
    utils.objectify("hello").should.equal("hello");
    utils.objectify('{"outputDir": "/tmp"}').outputDir.should.equal('/tmp');
    test.done();
};

exports.testHeadersEqual = function(test) {
    var h1 = {
        'accept-language': 'ja-jp',
        'user-agent': 'Android'
    };
    var h2 = {
        'user-agent': 'Android',
        'accept-language': 'ja-jp',
        'content-length': 0,
        'cookie': 'a cookie',
        'referer': 'no-one'
    };

    utils.headersEqual(h1, h2).should.equal(true);
    utils.headersEqual(h2, h1).should.equal(true);

    h1 = und.extend(h1);

    utils.headersEqual(h1, h2).should.equal(true);
    utils.headersEqual(h2, h1).should.equal(true);
    
    h2 = {
        'user-agent': 'iOS',
        'accept-language': 'ja-jp',
        'content-length': 0,
        'referer': 'no-one'
    };

    utils.headersEqual(h1, h2).should.equal(false);
    utils.headersEqual(h2, h1).should.equal(false);


    h2 = {
        'user-agent': 'iOS',
        'accept-language': 'ja-jp'
    };

    utils.headersEqual(h1, h2).should.equal(false);
    utils.headersEqual(h2, h1).should.equal(false);

    test.done();
};

exports.testContainsHeaders = function(test) {
    var headers = {
        'accept-charset': 'UTF-8',
        'user-agent': 'Test'
    };

    utils.containsHeaders([headers], headers).should.equal(true);
    utils.containsHeaders([], headers).should.equal(false);
    utils.containsHeaders([{'user-agent': 'Test'}], headers).should.equal(false);
    utils.containsHeaders([{'user-agent': 'Test'}, headers], headers).should.equal(true);
    utils.containsHeaders([headers, {'user-agent': 'Test'}], headers).should.equal(true);
    utils.containsHeaders([{'user-agent': 'Test'}, headers, {'content-length': 0}], headers).should.equal(true);
    utils.containsHeaders([{'accept-charset': 'UTF-16'}, {'user-agent': 'Test'}], headers).should.equal(false);

    test.done();
};