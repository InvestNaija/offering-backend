'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        return await Promise.all([
            queryInterface.addColumn('customers', 'mothersMaidenName', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('customers', 'placeOfBirth', {
                type: Sequelize.STRING
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
        return await Promise.all([
            queryInterface.removeColumn('customers', 'mothersMaidenName'),
            queryInterface.removeColumn('customers', 'placeOfBirth')
        ]);
    }
};
