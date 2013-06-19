var util = require('./obj-util.js');

describe('obj-util', function() {
   it('can identify an array', function () {
       var testArray = [ 'test', 'val' ];
       expect(util.toType(testArray)).toEqual('array');
   });

    it('can identify an object', function () {
        var testObj = { test: 'val' };
        expect(util.toType(testObj)).toEqual('object');
    });

    it('can identify a string', function () {
        var testString = 'testval';
        expect(util.toType(testString)).toEqual('string');
    });

    it('can identify a number', function () {
        var testVal = 1;
        expect(util.toType(testVal)).toEqual('number');
    });
});

