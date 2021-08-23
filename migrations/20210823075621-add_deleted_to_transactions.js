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
            queryInterface.addColumn('transactions', 'deletedAt', {
                type: Sequelize.DATE
            }),
            queryInterface.addColumn('transactions', 'deleted', {
                type: Sequelize.BOOLEAN
            })
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await Promise.all([
            queryInterface.removeColumn('transactions', 'deletedAt'),
            queryInterface.removeColumn('transactions', 'deleted')
        ]);
    }
};
