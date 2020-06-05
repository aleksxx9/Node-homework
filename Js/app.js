const fetch = require('node-fetch');
const fs = require('fs');

async function FetchData(url) {
  const data = fetch(url)
    .then((json) => json.json())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
  return data;
}

function CashIn(data, cashIn) {
  const percent = (data.operation.amount * cashIn.percents) / 100;
  if (percent > cashIn.max.amount) return cashIn.max.amount;
  return percent;
}

function GetLastOperationDate(data, id, i) {
  for (let index = i - 1; index >= 0; index -= 1) {
    if (data[index].user_type === id && data[index].type === 'cash_out') {
      return data[index].date;
    } if (index === 0) return data[i].date;
  }
}

function SameWeek(data, i, limit) {
  const currentDate = data[i].date;
  const weekLimit = limit;
  // Getting last cashout date with same user Id
  const lastCashOutDate = GetLastOperationDate(data, data[i].user_type, i);

  // get days difference between last cashout and current
  const days = (new Date(currentDate) - new Date(lastCashOutDate)) / 1000 / 60 / 60 / 24;
  const current = new Date(currentDate).getDay();
  const last = new Date(lastCashOutDate).getDay();

  // checking if it's same week
  if (days < 7) {
    if ((current >= last || current === 0) && last !== 0) {
      return weekLimit;
    } if (last === 0 && current === 0) return weekLimit;

    weekLimit[data[i].user_id] = 0;
    return weekLimit;
  }
  weekLimit[data[i].user_id] = 0;
  return weekLimit;
}

function CountPercents(amount, percents) {
  return (amount * percents) / 100;
}

function Natural(data, i, natural, idsLimit) {
  const idLimit = SameWeek(data, i, idsLimit);
  idLimit[data[i].user_id] += data[i].operation.amount;
  const amount = idLimit[data[i].user_id];

  if (amount <= natural.week_limit) {
    return 0;
  } if (amount > natural.week_limit.amount) {
    if (data[i].operation.amount === amount) {
      return CountPercents(
        data[i].operation.amount - natural.week_limit.amount,
        natural.percents,
      );
    }
    if (amount - data[i].operation.amount < natural.week_limit.amount) {
      return CountPercents(
        amount - natural.week_limit.amount,
        natural.percents,
      );
    } return CountPercents(data[i].operation.amount, natural.percents);
  }
  return 0;
}

function Juridical(data, juridical) {
  const result = CountPercents(data, juridical.percents);
  if (result < juridical.min.amount) {
    return juridical.min.amount;
  } return result;
}

function GetDifferentId(data) {
  // gets all distinct id's
  const limit = [
    ...new Set(
      data.map(({ user_id, user_type }) => {
        if (user_type === 'natural') return user_id;
        return null;
      }),
    ),
  ];
  // returns id's without null values
  return limit.filter((n) => n);
}

function PrintAnswer(answer) {
  const data = answer * 100;
  const percents = Math.ceil(data);
  console.log((percents / 100).toFixed(2));
}

fs.readFile(
  process.argv[2] ? process.argv[2] : 'input.json',
  (async (err, json) => {
    // Fetching operation values from Api's
    if (err) {
      console.error(err);
      process.exit(1);
    }
    const data = JSON.parse(json);

    const cashIn = await FetchData('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in');
    const natural = await FetchData('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural');
    const juridical = await FetchData('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical');

    // Getting different id's from given data to count natural limits for each natural user
    let idsLimit = [];
    idsLimit = GetDifferentId(data);

    const limit = {};

    // making initial used limit for each user 0
    idsLimit.map((el) => {
      limit[el] = 0;
      return limit[el];
    });

    // Making operations
    let answer = '';
    data.forEach((el, i) => {
      if (el.type === 'cash_in') {
        answer = CashIn(el, cashIn);
      } else if (el.type === 'cash_out') {
        if (el.user_type === 'natural') {
          const limits = Natural(data, i, natural, limit);
          answer = limits;
        } else if (el.user_type === 'juridical') {
          answer = Juridical(el.operation.amount, juridical);
        }
      }
      PrintAnswer(answer);
    });
  }),
);

module.exports = {
  FetchData,
  CashIn,
  Natural,
  Juridical,
  GetDifferentId,
  SameWeek,
  GetLastOperationDate,
};
