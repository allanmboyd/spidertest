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

    h1 = {
        referer: 'http://localhost:54054/testImages/original.jpg'
    };

    h2 = {
        referer: 'http://localhost:54054/testImages/original.jpg',
        'content-length': 0
    };

    utils.headersEqual(h1, h2).should.equal(true);
    utils.headersEqual(h2, h1).should.equal(true);

    test.done();
};

exports.testContainsHeaders = function(test) {
    var headers = {
        'accept-charset': 'UTF-8',
        'user-agent': 'Test'
    };

    utils.containsHeaders([headers], headers).should.equal(true);
    utils.containsHeaders([], headers).should.equal(false);
    utils.containsHeaders([
        {'user-agent': 'Test'}
    ], headers).should.equal(false);
    utils.containsHeaders([
        {'user-agent': 'Test'},
        headers
    ], headers).should.equal(true);
    utils.containsHeaders([headers, {'user-agent': 'Test'}], headers).should.equal(true);
    utils.containsHeaders([
        {'user-agent': 'Test'},
        headers,
        {'content-length': 0}
    ], headers).should.equal(true);
    utils.containsHeaders([
        {'accept-charset': 'UTF-16'},
        {'user-agent': 'Test'}
    ], headers).should.equal(false);

    test.done();
};

exports.testReplacePlaceholdersWithWildcard = function(test) {
    utils.replacePlaceholdersWithWildcard("a").should.equal("a");
    utils.replacePlaceholdersWithWildcard("/a/b/c").should.equal("/a/b/c");
    utils.replacePlaceholdersWithWildcard("a/b/c").should.equal("a/b/c");
    utils.replacePlaceholdersWithWildcard("/a/b/d/").should.equal("/a/b/d/");
    utils.replacePlaceholdersWithWildcard("a/b/e/").should.equal("a/b/e/");

    utils.replacePlaceholdersWithWildcard("/:a/b/c").should.equal("/.*/b/c");
    utils.replacePlaceholdersWithWildcard(":a/b/c").should.equal(".*/b/c");
    utils.replacePlaceholdersWithWildcard("/a/b/:d/").should.equal("/a/b/.*/");
    utils.replacePlaceholdersWithWildcard("a/b/:e/").should.equal("a/b/.*/");
    utils.replacePlaceholdersWithWildcard(":a/b/:c").should.equal(".*/b/.*");
    utils.replacePlaceholdersWithWildcard("a/:b/c").should.equal("a/.*/c");
    utils.replacePlaceholdersWithWildcard(":a/:b/:c").should.equal(".*/.*/.*");
    utils.replacePlaceholdersWithWildcard(":a").should.equal(".*");

    test.done();
};

exports.testDeterminePathVariableValues = function(test) {
    var vals = utils.determinePathVariableValues("/ignore/1/2/ignore/3", "/ignore/:one/:two/ignore/:three");
    vals.one.should.equal('1');
    vals.two.should.equal('2');
    vals.three.should.equal('3');

    vals = utils.determinePathVariableValues("ignore/1/2/ignore/3", "ignore/:one/:two/ignore/:three");
    vals.one.should.equal('1');
    vals.two.should.equal('2');
    vals.three.should.equal('3');

    vals = utils.determinePathVariableValues("ignore/1/2/ignore/3/", "ignore/:one/:two/ignore/:three/");
    vals.one.should.equal('1');
    vals.two.should.equal('2');
    vals.three.should.equal('3');

    vals = utils.determinePathVariableValues("start/of/the/path/1/2/ignore/3", ":start/:one/:two/ignore/:three/");
    und.isEmpty(vals).should.equal(true);

    test.done();
};

exports.testReplacePlaceholdersInString = function(test) {
    var vals = {
        'one': '1',
        'two': '2',
        'three': '3'
    };

    var replaced = utils.replacePlaceholdersInString("Numbers :one, :two and :three are all expected", vals);
    replaced.should.equal("Numbers 1, 2 and 3 are all expected");

    replaced = utils.replacePlaceholdersInString("Numbers :one and :two are expected.", vals);
    replaced.should.equal("Numbers 1 and 2 are expected.");

    replaced = utils.replacePlaceholdersInString("Numbers :three and :one and another :three are expected.", vals);
    replaced.should.equal("Numbers 3 and 1 and another 3 are expected.");

    replaced = utils.replacePlaceholdersInString("Numbers ':three' and \":one\" and another :three!", vals);
    replaced.should.equal("Numbers '3' and \"1\" and another 3!");

    replaced = utils.replacePlaceholdersInString("Numbers [:three] and {:one} and another (:three).", vals);
    replaced.should.equal("Numbers [3] and {1} and another (3).");

    replaced = utils.replacePlaceholdersInString("Numbers: :two, :one", vals);
    replaced.should.equal("Numbers: 2, 1");

    replaced = utils.replacePlaceholdersInString(":three: the larch", vals);
    replaced.should.equal("3: the larch");

    replaced = utils.replacePlaceholdersInString("URL /images/:two/img.png", vals);
    replaced.should.equal("URL /images/2/img.png");


    test.done();
};

exports.testObjectKeysToLowerCase = function(test) {

    var headers = {
        'Accept-Charset': 'UTF-8',
        'User-Agent': 'Test'
    };

    headers = utils.objectKeysToLowerCase(headers);
    should.not.exist(headers['Accept-Charset']);
    should.exist(headers['accept-charset']);
    should.not.exist(headers['User-Agent']);
    should.exist(headers['user-agent']);
    headers['accept-charset'].should.equal('UTF-8');
    headers['user-agent'].should.equal('Test');

    test.done();
};