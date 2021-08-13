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
            queryInterface.addColumn('transactions', 'module', {
                type: Sequelize.STRING,
            }),
            queryInterface.addColumn('transactions', 'momoAgentId', {
                type: Sequelize.STRING,
            }),
            queryInterface.addColumn('transactions', 'productType', {
                type: Sequelize.STRING,
            }),
            queryInterface.addColumn('transactions', 'processedByAdmin', {
                type: Sequelize.BOOLEAN
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
            queryInterface.removeColumn('transactions', 'module'),
            queryInterface.removeColumn('transactions', 'momoAgentId'),
            queryInterface.removeColumn('transactions', 'productType'),
            queryInterface.removeColumn('transactions', 'processedByAdmin')
        ])
    }
};
