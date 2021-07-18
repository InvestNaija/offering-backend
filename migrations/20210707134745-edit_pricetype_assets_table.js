'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        return Promise.all([
            queryInterface.changeColumn('assets', 'sharePrice', {
                type: Sequelize.DOUBLE,
                allowNull: false
            }),
            queryInterface.changeColumn('assets', 'anticipatedMaxPrice', {
                type: Sequelize.DOUBLE
            }),
            queryInterface.changeColumn('assets', 'anticipatedMinPrice', {
                type: Sequelize.DOUBLE
            }),
            queryInterface.changeColumn('assets', 'description', {
                type: Sequelize.TEXT
            }),
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        return Promise.all([
            queryInterface.changeColumn('assets', 'sharePrice', {
                type: Sequelize.INTEGER,
                allowNull: false
            }),
            queryInterface.changeColumn('assets', 'anticipatedMaxPrice', {
                type: Sequelize.INTEGER
            }),
            queryInterface.changeColumn('assets', 'anticipatedMinPrice', {
                type: Sequelize.INTEGER
            }),
            queryInterface.changeColumn('assets', 'description', {
                type: Sequelize.STRING
            }),
        ]);
    }
};
