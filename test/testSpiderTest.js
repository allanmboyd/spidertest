var express = require("express");
var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var should = require("should");

var spiderTestModule = loadModule("./lib/spiderTest.js");
var spiderTest = require("../lib/spiderTest");

var server = express.createServer();

server.configure(function() {
//    server.use(express.logger());
    server.use(server.router);
    server.use(express["static"]("test/resources"));
});

server.listen();
serverPort = server.address().port;

exports.testResolveUrl = function (test) {
    var url = spiderTestModule.resolveUrl("http://nodejs.org");
    "http:".should.equal(url.protocol);
    "nodejs.org".should.equal(url.hostname);
    "80".should.equal(url.port);
    "/".should.equal(url.path);
    "nodejs.org:80".should.equal(url.host);
    "http://nodejs.org:80/".should.equal(url.href);
    
    url = spiderTestModule.resolveUrl("hello");

    "http:".should.equal(url.protocol);
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "/hello".should.equal(url.path);
    "http://localhost:80/hello".should.equal(url.href);

    url = spiderTestModule.resolveUrl("http://localhost:80/");
    "localhost".should.equal(url.hostname);
    "80".should.equal(url.port);
    "localhost:80".should.equal(url.host);
    "http://localhost:80/".should.equal(url.href);
    
    test.done();
};

exports.testPopulateTestFiles = function (test) {
    var tests = [];
    spiderTestModule.populateTestFiles("test/resources/testJS", tests);
    tests.length.should.equal(2);
    tests[0].should.equal("./test/resources/testJS/some.js");
    tests[1].should.equal("./test/resources/testJS/somemoretests/anotherTest.js");

    test.done();
};

exports.testRunTests = function (test) {
    // For some reason "process" is not available inside modules that are tested by nodeunit
    // this is why process is used here to establish the test directory
    spiderTest.runTests("http://localhost:" + serverPort + "/testIndex.html", process.cwd() + "/" + "examples/tests");
    test.done();
};