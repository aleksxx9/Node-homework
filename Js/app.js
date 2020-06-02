const fetch = require("node-fetch");
const fs = require("fs");

fs.readFile(
  process.argv[2] ? process.argv[2] : "input.json",
  async function Read (err, json) {
    //Fetching operation values from Api's
    if (err) throw err;
    let data = JSON.parse(json);
    cashIn = await fetchData(
      "http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in"
    );
    natural = await fetchData(
      "http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural"
    );
    juridical = await fetchData(
      "http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical"
    );

    //Getting different id's from given data to count natural limits for each natural user
    let idsLimit = [];
    idsLimit = getDifferentId(data);
    
    let limit = {};

    //making initial used limit for each user 0
    idsLimit.map((el) => {
      limit[el] = 0;
    });

    //Making operations
    let answer = '';
    data.forEach((el, i) => {
      if (el.type == "cash_in") {
        answer = CashIn(el, cashIn);
      } else if (el.type == "cash_out") {
        if (el.user_type == "natural") {
          limits = Natural(data, i, natural, limit);
          answer = limits;
        } else if (el.user_type == "juridical") {
          answer = Juridical(el.operation.amount, juridical);
        }
      }
      PrintAnswer(answer);
    });
  }
);

async function fetchData(url) {
  let res = await fetch(url);
  let data = await res.json();
  return data;
}

function CashIn(data, cashIn) {
  const percent = (data.operation.amount * cashIn.percents) / 100;
  if (percent > cashIn.max.amount) return(cashIn.max.amount);
  else return(percent);
}

function Natural(data, i, natural, idsLimit) {
  operationLimit = SameWeek(data, i, idsLimit);
  idsLimit[data[i].user_id] += data[i].operation.amount;
  amount = idsLimit[data[i].user_id];

  if (amount <= natural.week_limit) {
    return('0.00');
  }
  else {
    let result;
    if (amount > natural.week_limit.amount)
    {
      if (data[i].operation.amount == amount) result = (data[i].operation.amount - natural.week_limit.amount) * natural.percents / 100;
      else result = data[i].operation.amount * natural.percents / 100;
    }
    else {
      result = 0.00;
    }
    return(result);
  }
}

function Juridical(data, juridical) {
  result = data * juridical.percents / 100;
  if (result < juridical.min.amount) {
    return(juridical.min.amount);
  }
  else return(result);
}

function getDifferentId(data) {
  //gets all distinct id's 
  let limit =  [
    ...new Set(
      data.map(({ user_id, user_type }) => {
        if (user_type == "natural") return user_id;
        else return null;
      })
    ),
  ];
  //returns id's without null values
  return limit.filter((n) => n);
}

function SameWeek(data, i, limit) {
  const currentDate = data[i].date;

  //Getting last cashout date with same user Id
  const lastCashOutDate = GetLastOperationDate(data, data[i].user_type, i);

  //get days difference between last cashout and current
  const days = (new Date(currentDate) - new Date(lastCashOutDate)) / 1000 / 60 / 60 / 24;
  const current = new Date(currentDate).getDay();
  const last = new Date(lastCashOutDate).getDay();

  //checking if it's same week
  if (days < 7) {
    if ((current >= last || current == 0) && last != 0) {
      return limit;
    } else if (last == 0 && current == 0) return limit;
    else {
      limit[data[i].user_id] = 0;
      return limit;
    }
  }
  else {
    limit[data[i].user_id] = 0;
    return limit;
  }
}

function GetLastOperationDate(data, id, i) {
  for (let index = i - 1; index >= 0; index--) {
    if (data[index].user_type == id && data[index].type == "cash_out") {
      return data[index].date;
    } else if (index == 0) return data[i].date;
  }
}

function PrintAnswer(answer)
{
  answer = answer.toString();
  countAfterComma = (answer % 1).toString().length;
  if (countAfterComma >= 5) {
    console.log((+parseFloat(answer).toFixed(2) + 0.01).toFixed(2));
  }
  else {
    console.log(parseFloat(answer).toFixed(2));
  }
}

module.exports = {
  fetchData: fetchData,
  CashIn: CashIn,
  Natural: Natural,
  Juridical: Juridical,
  getDifferentId: getDifferentId,
  SameWeek: SameWeek,
  GetLastOperationDate: GetLastOperationDate
}

