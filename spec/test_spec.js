var Calculator = require('./calculator');

describe("Calculator", function () {
  var calculator;
  beforeEach(function (){
    calculator = Calculator();
  });

  describe("add()", function () {
    it("adds two numbers together", function () {
      var numOne = 2;
      var numTwo = 6;
      var expectedResult = 8;

      var actualResult = calculator.add(numOne, numTwo);

      expect(actualResult).toEqual(expectedResult);
    });
  });
});