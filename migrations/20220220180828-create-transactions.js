'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userUuid: {
        type: Sequelize.STRING
      },
      walletId: {
        type: Sequelize.STRING
      },
      categoryId: {
        type: Sequelize.STRING
      },
      balance: {
        type: Sequelize.FLOAT
      },
      date: {
        type: Sequelize.DATE
      },
      note: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM('income', 'expense')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Transactions');
  }
};