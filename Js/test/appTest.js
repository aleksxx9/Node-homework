const assert = require("chai").assert;
const app = require("../app");
const data = require('./testinput');
const cashIn = require('./cashIn');
const juridical = require('./Juridical');
const natural = require('./Natural');

describe("App", function () {
  describe("fetchData", function () {
    it("fetchData should return json object", async function () {
      const result = await app.fetchData(
        "http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in"
      );
      assert.typeOf(result, "object");
    });
  });
  describe("getDifferentId", function () {
    it("getDifferentId should return array", function () {
      const result = app.getDifferentId(data);
      assert.typeOf(result, "array");
    });
  });
  describe("SameWeek", function () {
    it("SameWeek should return object", function () {
      const limit = [{ "1": 0, "3": 0 }];
      const result = app.SameWeek(data, 2, limit);
      assert.typeOf(result, "array");
    });
  });
  describe("Juridical", function () {
    it("Juridical should return number more than Juridical minimum amount", function () {
      const result = app.Juridical(300, juridical);
      assert.isAbove(result, juridical.min.amount);
    });
  });
  describe("CashIn", function () {
    it("CashIn should return fee less or equal to max fee amount ", function () {
      const data = {
        date: "2016-01-10",
        user_id: 2,
        user_type: "juridical",
        type: "cash_in",
        operation: { amount: 1000000, currency: "EUR" },
      };
      const result = app.CashIn(data, cashIn);
      assert.isAtMost(result, cashIn.max.amount);
    });
  });
  describe("Natural", function () {
    it("Natural should return fee if limit is greater than weekLimit", function () {
      const data = [
        {
          date: "2016-01-06",
          user_id: 1,
          user_type: "natural",
          type: "cash_out",
          operation: { amount: 30000, currency: "EUR" },
        },
        {
          date: "2016-01-07",
          user_id: 1,
          user_type: "natural",
          type: "cash_out",
          operation: { amount: 1000.0, currency: "EUR" },
        },
        ];
        let limit = { '1': 0, '3': 0 };
        const result = app.Natural(data, 1, natural, limit);
        if (limit > natural.week_limit.amount) assert.isAbove(result, 0, 'limit is exceeded');
        else assert.equal(result, 0, 'limit is not exceeded');
    });
  });
});
