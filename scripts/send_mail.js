const nodemailer = require("nodemailer");
const Intl = require("intl");
var moment = require("moment");
const { Transactions, Categories, Users } = require("../models");
const sequelize = require("sequelize");
const Op = sequelize.Op;

class Category {
  constructor(title, money, percent = 30) {
    this.title = title || null;
    this.money = money || null;
    this.percent = percent || null;
  }
}

class TransactionHistory {
  constructor(date, category, note, price, isIncome) {
    this.date = date || null;
    this.category = category || null;
    this.note = note || null;
    this.price = price || null;
    this.isIncome = isIncome || null;
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "anhdung2881999@gmail.com",
    pass: "vyhaqvussnxigqra",
  },
});
const timeNow = moment(Date.now()).format("MMM DD, YYYY");

const dataChartPie = (title, value, colorTitle, dataChart) => {
  var backgroundColor = [];
  var data = [];
  var formatterValue = Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  if (dataChart.length > 0) {
    for (var i = 0; i < dataChart.length; i++) {
      backgroundColor.push(colorTitle);
      data.push(parseInt((dataChart[i] / value).toFixed(2) * 100, 10));
    }
  } else {
    backgroundColor.push("gray");
    data.push(100);
  }

  return {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColor,
          datalabels: {
            display: dataChart.length > 0 ? true : false,
            color: "white",
          },
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      plugins: {
        doughnutlabel: {
          labels: [
            {
              text: title,
              font: {
                size: 17,
                family: "Mukta",
                weight: 600,
              },
            },
            {
              text: "$" + formatterValue,
              font: { size: 16, family: "Mukta" },
              color: colorTitle,
            },
          ],
        },
      },
    },
  };
};

const header = (nameUser) => {
  return `
    <div style = "padding:24px">
      <table style="width:100%">
        <tr>
          <th style="text-align: left;font-family:Mukta; font-size:18px; color: #414742;font-weight: 600; text-transform: uppercase;">Hi, ${nameUser}</th>
          <th style="text-align: right;font-family:Mukta; font-size:14px; color: #414742;font-weight: 500;">Transaction History</th>
        </tr>
        <tr>
          <td></td>
          <td style="text-align: right;font-family:Mukta; font-size:18px; color: #414742;font-weight: 600;">${timeNow}</td>
        </tr>
      </table>
    </div>
  `;
};

const itemTransaction = (transaction) => {
  return `
      <tr style="font-family:Mukta;font-size:14px; color: #414742;font-weight: 400;">
        <td>${transaction.date}</td>
        <td>${transaction.category}</td>
        <td>${transaction.note}</td>
        <td style="font-family:Mukta;font-size:16px; color:${
          transaction.isIncome ? "#008BF8" : "#F85F5F"
        } ;font-weight: 600;">
        ${transaction.isIncome ? "+" : "-"}$${transaction.price}
        </td>
      </tr>
  `;
};

const getListCategoryUnique = (array, categoryArr, arrayUnique) => {
  for (let i = 0; i < array.length; i++) {
    if (categoryArr.includes(array[i].title)) {
      let index = arrayUnique.findIndex((item) => item.title == array[i].title);
      arrayUnique[index].money += array[i].money;
    } else {
      categoryArr.push(array[i].title);
      arrayUnique.push(array[i]);
    }
  }
};

const getListTransaction = async (
  uuid,
  transactions,
  totalIncome,
  totalExpense,
  incomeArrayUnique,
  expenseArrayUnique
) => {
  let incomeArray = [];
  let expenseArray = [];
  let incomeCategory = [];
  let expenseCategory = [];
  var date = moment(Date.now()).format("MM-DD-YYYY").split("-");
  // const dateQuery = date[2] + "/" + date[0] + "/01";
  const dateQuery = 2021 + "/" + 11 + "/01";
  const startOfMonth = moment(dateQuery, "YYYY-MM-DD hh:mm")
    .clone()
    .startOf("month");
  const endOfMonth = moment(dateQuery, "YYYY-MM-DD hh:mm")
    .clone()
    .endOf("month");

  const total = await Transactions.findOne({
    where: {
      userUuid: uuid,
      date: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    attributes: [
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(
            `CASE WHEN "Transactions"."type" = 'income' THEN balance ELSE 0 END`
          )
        ),
        "totalIncome",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(
            `CASE WHEN "Transactions"."type" = 'expense' THEN balance ELSE 0 END`
          )
        ),
        "totalExpense",
      ],
    ],
  });
  totalIncome = total.dataValues["totalIncome"];
  totalExpense = total.dataValues["totalExpense"];

  const result = await Transactions.findAndCountAll({
    where: {
      userUuid: uuid,
      date: {
        [Op.between]: [startOfMonth, endOfMonth],
      },
    },
    order: [["date", "DESC"]],
    include: [{ model: Categories, as: "category" }],
  });
  if (result["rows"].length > 0) {
    for (var i = 0; i < result["rows"].length; i++) {
      var date = moment(result["rows"][i]["dataValues"]["date"]).format(
        "DD MMM YYYY"
      );
      transactions.push(
        new TransactionHistory(
          date,
          result["rows"][i]["dataValues"]["category"]["dataValues"]["name"],
          result["rows"][i]["dataValues"]["note"],
          result["rows"][i]["dataValues"]["balance"],
          result["rows"][i]["dataValues"]["type"] == "income" ? true : false
        )
      );
    }
    // split 2 array
    transactions.forEach((item) => {
      if (item.isIncome) {
        incomeArray.push(new Category(item.category, item.price));
      } else {
        expenseArray.push(new Category(item.category, item.price));
      }
    });
    getListCategoryUnique(incomeArray, incomeCategory, incomeArrayUnique);
    getListCategoryUnique(expenseArray, expenseCategory, expenseArrayUnique);
  }
  return {
    income: totalIncome,
    expense: totalExpense,
  };
};

const footer = async (transactionHistory) => {
  return `
  <div style='background-color:#FFFFFF;border-radius: 16px; padding:24px; margin: 24px'>
    <p style="font-family:Mukta; font-size:18px; color: #414742;font-weight: 600; text-transform: uppercase">
      Transaction
    </p>
    <table style="width:100%">
      <tr style="text-align: left;font-family:Mukta;font-size:17px; color: #414742;font-weight: 600;">
        <th>Date</th>
        <th>Category</th>
        <th>Note</th>
        <th>Price</th>
      </tr>
      ${
        transactionHistory.length > 0
          ? transactionHistory.map((value) => itemTransaction(value)).join("")
          : `<p style="font-family:Mukta; font-size:16px; color: #414742;font-weight: 600">
            You don't have any transaction this month
          </p>`
      }
    </table>
  </div>
  `;
};

const img = (income, incomeData) => {
  return `https://quickchart.io/chart?c=${JSON.stringify(
    dataChartPie("Income", income, "blue", incomeData)
  )}`;
};
const img2 = (expense, expenseData) => {
  return `https://quickchart.io/chart?c=${JSON.stringify(
    dataChartPie("Expense", expense, "red", expenseData)
  )}`;
};

const category = (category, percent) => {
  var formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return `
    <div align="left"; style="background-color:#FFFFFF; border-radius: 12px; width: 164px; height:112px; margin-left: 20px; padding: 16px">
      <p style="font-family:Mukta;font-size:16px; color: #252827;">  
        ${category.title} 
      </p>
      <p style="font-family:Mukta;font-size:17px; color: #414742;font-weight: 600;">
        ${formatter.format(category.money)}
      </p>
      <p style="font-family:Mukta;font-size:12px; color: #9C9E9D;">
        ${percent}%
      </p>
    </div>
  `;
};

const leftChart = (income, incomeArr) => {
  const incomeData = [];
  incomeArr.forEach((item) => {
    incomeData.push(item.money);
  });
  return `
  <div align="center">
    <img src=${img(
      income,
      incomeData
    )} alt='Income' height='250' width='250' margin-bottom: 42px;/>
    <div style='display: flex;margin-top: 42px;'>
        <div>
        ${incomeArr
          .map((value, index) => {
            if (index % 2 == 0) {
              return category(value, parseInt((value.money / income) * 100));
            }
          })
          .join("")}
        </div>
        <div>
          ${incomeArr
            .map((value, index) => {
              if (index % 2 == 1) {
                return category(value, parseInt((value.money / income) * 100));
              }
            })
            .join("")}
        </div>
    </div>
  </div>`;
};
const rightChart = (expense, expenseArr) => {
  const expenseData = [];
  expenseArr.forEach((item) => {
    expenseData.push(item.money);
  });
  return `
  <div align="center">
    <img src=${img2(
      expense,
      expenseData
    )} alt='Expense' height='250' width='250' />
    <div style='display: flex; margin-top: 42px;'>
        <div>
        ${expenseArr
          .map((value, index) => {
            if (index % 2 == 0) {
              return category(value, parseInt((value.money / expense) * 100));
            }
          })
          .join("")}
        </div>
        <div>
          ${expenseArr
            .map((value, index) => {
              if (index % 2 == 1) {
                return category(value, parseInt((value.money / expense) * 100));
              }
            })
            .join("")}
        </div>
    </div>
  </div>
  `;
};

const getAllUser = async () => {
  const users = await Users.findAll({
    where: {
      email: {
        [Op.not]: null,
      },
    },
  });
  return users;
};
getAllUser().then((userAll) => {
  userAll.forEach(async (user) => {
    let transactions = [];
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeArrayUnique = [];
    let expenseArrayUnique = [];
    await getListTransaction(
      user.dataValues.uuid,
      transactions,
      totalIncome,
      totalExpense,
      incomeArrayUnique,
      expenseArrayUnique
    ).then(async (value) => {
      var footerHtml = await footer(transactions);
      transporter
        .sendMail({
          from: '"Anh Dung" <anhdung2881999@gmail.com>',
          to: user.dataValues.email,
          subject: "Your spending statistics this month",
          html: `
        <div style='background-color:#F9F9F9;width:1000px'>
          ${header(user.dataValues.name)}
          <div align='center'; style='display: flex;justify-content: space-between; margin-top: 42px;margin-bottom: 24px; width:1000px'>
            ${leftChart(value.income, incomeArrayUnique)}
            ${rightChart(value.expense, expenseArrayUnique)}
          </div>
          ${footerHtml}
        </div>
      `,
        })
        .catch(console.error);
    });
  });
});
