var assert = require('assert');


var utils = require("/home/ubuntu/workspace/util.js");

describe('Utilites functions (util.js):', function() {
    describe('Test string it is not bot command (ncmd):', function() {
        it('should return 1 if parameters are ("Test", ["command1", "command2"])', function() {
            assert.equal(1, utils.ncmd("Test", ["command1", "command2"]));
        });
        it('should return 0 if parameters are ("Test", ["command1", "Test", "command2"])', function() {
            assert.equal(0, utils.ncmd("Test", ["command1", "Test", "command2"]));
        });
    });

    describe('Find only unique elements of array (unique):', function() {
        it('should return input array if parameters are ["test1", "test2", "test3"] - no same elements', function() {
            assert.equal(["test1", "test2", "test3"], utils.unique(["test1", "test2", "test3"]));
        });
        it('should return ["test2", "test3"] if parameters are ["test3", "test3", "test2", "test3"]', function() {
            assert.equal(["test2", "test3"], utils.unique(["test3", "test3", "test2", "test3"]));
        });
    });
});
