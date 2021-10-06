'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await Promise.all([
      queryInterface.createTable('receiving_agent_companies', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4
        },

        name: {
          type: Sequelize.STRING,
          defaultValue: null
        },

        email: {
          type: Sequelize.STRING
        },

        phoneNumber: {
          type: Sequelize.STRING
        },

        code: {
          type: Sequelize.STRING
        },

        organizationType: {
          type: Sequelize.STRING,
        },

        createdAt: {
          type: Sequelize.DATE,
        },

        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: null
        },

        deletedAt: {
          type: Sequelize.DATE,
          defaultValue: null
        }
      }),

      queryInterface.addColumn('brokers', 'receivingAgentCompanyId', {
        type: Sequelize.UUID,
        references: {
          model: 'receiving_agent_companies',
          key: 'id'
        },
        onUpdate: 'cascade',
        onDelete: 'SET NULL'
      })
    ])
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await Promise.all([
      queryInterface.dropTable('receiving_agent_companies'),
      queryInterface.removeColumn('receivingAgentCompanyId')
    ])
  }
};
