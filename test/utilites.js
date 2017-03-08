var chai = require("chai"),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

var utils = require(__dirname.replace("test", "util.js"));

describe("Utilites functions (util.js):", function() {
    describe("Test string it is not bot command (ncmd):", function() {
        it("should return 1 if parameters are (\"Test\", [\"command1\", \"command2\"])", function() {
            assert.equal(1, utils.ncmd("Test", ["command1", "command2"]));
        });
        it("should return 0 if parameters are (\"Test\", [\"command1\", \"Test\", \"command2\"])", function() {
            assert.equal(0, utils.ncmd("Test", ["command1", "Test", "command2"]));
        });
    });

    describe('Find only unique elements of array (unique):', function() {
        it('should return input array if there are no same elements', function() {
            expect(utils.unique(["test1", "test2", "test3"])).to.deep.have.members(["test1", "test2", "test3"]);
        });
        it('should return array with unique elements if there are same elements', function() {
            expect(utils.unique(["test3", "test3", "test2", "test3"])).to.deep.have.members(["test2", "test3"]);
        });
    });

    describe("Converting db array to string and vice versa", function() {
        describe("Array to str", function() {
            it("should convert non empty array to str", function() {
                var tstr = "test1: 11.40\nVasya: Dostizhenie #1\ntest 2: 10.55";
                var res = utils.dbarr_to_str([
                    ["test1", "11.40"],
                    ["Vasya", "Dostizhenie #1"],
                    ["test 2", "10.55"]
                ]);

                tstr.should.equal(res);
            });
            it("should convert empty array to empty str", function() {
                var tstr = "";
                var res = utils.dbarr_to_str([]);

                tstr.should.equal(res);
            });
        });
        describe("Str to array", function() {
            it("should convert non empty str to array", function() {
                var tArr = [
                    ["test1", "11.40"],
                    ["Vasya", "Dostizhenie #1"],
                    ["test 2", "10.55"]
                ];
                var res = utils.str_to_dbarr("test1: 11.40\nVasya: Dostizhenie #1\ntest 2: 10.55");

                expect(res).to.deep.have.members(tArr);
            });
            it("should convert empty str to empty array", function() {
                var tArr = [
                    ['']
                ];
                var res = utils.str_to_dbarr("");

                expect(res).to.deep.have.members(tArr);
            });
        });
    });
});
