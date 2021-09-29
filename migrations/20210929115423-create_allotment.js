'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('allotments', {
      id: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },

      batch: Sequelize.INTEGER,

      customerName: {
        type: Sequelize.STRING,
        defaultValue: null,
      },

      assetName: {
        type: Sequelize.STRING,
        defaultValue: null,
      },

      sharePrice: Sequelize.FLOAT,

      allotedUnits: Sequelize.FLOAT,

      allotedAmount: Sequelize.FLOAT,

      allotmentRefund: Sequelize.FLOAT,

      customerTotalPurchase: Sequelize.FLOAT,

      processed: Sequelize.BOOLEAN,

      emailSent: Sequelize.BOOLEAN,

      assetId: {
        type: Sequelize.UUID,
        references: {
          model: 'assets',
          key: 'id'
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL'
      },

      transactionId: {
        type: Sequelize.UUID,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL'
      },

      customerId: {
        type: Sequelize.UUID,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL'
      },

      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: null
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.UUIDV4
      },

      deletedAt: {
        type: Sequelize.DATE,
        defaultValue: null
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('allotments');
  }
};
