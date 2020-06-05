/* eslint-disable no-shadow */
/* eslint-disable no-undef */
const { assert } = require('chai');
const app = require('../app');
const data = require('./testinput');
const cashIn = require('./cashIn');
const juridical = require('./Juridical');
const natural = require('./Natural');

describe('App', () => {
  describe('GetDifferentId', () => {
    it('GetDifferentId should return array', () => {
      const result = app.GetDifferentId(data);
      assert.typeOf(result, 'array');
    });
  });
  describe('SameWeek', () => {
    it('SameWeek should return object', () => {
      const limit = [{ 1: 0, 3: 0 }];
      const result = app.SameWeek(data, 2, limit);
      assert.typeOf(result, 'array');
    });
  });
  describe('Juridical', () => {
    const result = app.Juridical(300, juridical);
    it('Juridical should return number more than Juridical minimum amount', () => {
      assert.isAbove(result, juridical.min.amount);
    });
    it('Juridical should return number', () => {
      assert.typeOf(result, 'number');
    });
  });
  describe('CashIn', () => {
    const data = {
      date: '2016-01-10',
      user_id: 2,
      user_type: 'juridical',
      type: 'cash_in',
      operation: { amount: 1000000, currency: 'EUR' },
    };
    const result = app.CashIn(data, cashIn);
    it('CashIn should return fee less or equal to max fee amount ', () => {
      assert.isAtMost(result, cashIn.max.amount);
    });
    it('CashIn should return number', () => {
      assert.typeOf(result, 'number');
    });
  });
  describe('Natural', () => {
    const data = [
      {
        date: '2016-01-06',
        user_id: 1,
        user_type: 'natural',
        type: 'cash_out',
        operation: { amount: 30000, currency: 'EUR' },
      },
      {
        date: '2016-01-07',
        user_id: 1,
        user_type: 'natural',
        type: 'cash_out',
        operation: { amount: 1000.0, currency: 'EUR' },
      },
    ];
    const limit = { 1: 0, 3: 0 };
    const result = app.Natural(data, 1, natural, limit);
    it('Natural should return fee if limit is greater than weekLimit', () => {
      if (limit > natural.week_limit.amount) assert.isAbove(result, 0, 'limit is exceeded');
      else assert.equal(result, 0, 'limit is not exceeded');
    });
    it('Natural should return number', () => {
      assert.typeOf(result, 'number');
    });
  });
});
