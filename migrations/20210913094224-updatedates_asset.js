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
            queryInterface.addColumn('assets', 'allocationDate', {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null
            }),
            queryInterface.addColumn('assets', 'fundingDate', {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null
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
            queryInterface.removeColumn('assets', 'allocationDate'),
            queryInterface.removeColumn('assets', 'fundingDate')
        ])
    }
};
