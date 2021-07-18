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
            queryInterface.addColumn('customers', 'nextOfKinName', {
                type: Sequelize.STRING,
                allowNull: true
            }),
            queryInterface.addColumn('customers', 'nextOfKinPhoneNumber', {
                type: Sequelize.STRING,
                allowNull: true
            }),
            queryInterface.addColumn('customers', 'nextOfKinEmail', {
                type: Sequelize.STRING,
                allowNull: true
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
        return Promise.all([
            queryInterface.removeColumn('customers', 'nextOfKinName'),
            queryInterface.removeColumn('customers', 'nextOfKinPhoneNumber'),
            queryInterface.removeColumn('customers', 'nextOfKinEmail')
        ])
    }
};
