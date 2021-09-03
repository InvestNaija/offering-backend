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
            queryInterface.addColumn('assets', 'openingDate', {
                type: Sequelize.DATE,
                defaultValue: null
            }),
            queryInterface.addColumn('assets', 'maturityDate', {
                type: Sequelize.DATE,
                defaultValue: null
            }),
            queryInterface.addColumn('assets', 'paymentLabel', {
                type: Sequelize.STRING,
                defaultValue: null
            }),
            queryInterface.addColumn('assets', 'paymentLogo', {
                type: Sequelize.STRING,
                defaultValue: null,
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
            queryInterface.removeColumn('assets', 'openingDate'),
            queryInterface.removeColumn('assets', 'maturityDate'),
            queryInterface.removeColumn('assets', 'paymentLabel'),
            queryInterface.removeColumn('assets', 'paymentLogo')
        ])
    }
};
