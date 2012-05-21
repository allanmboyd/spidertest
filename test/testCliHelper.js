var should = require("should");
var cliHelper = require("../lib/cliHelper");

exports.testObjectify = function(test) {
    cliHelper.objectify("hello").should.equal("hello");
    cliHelper.objectify('{"outputDir": "/tmp"}').outputDir.should.equal('/tmp');
    test.done();
};