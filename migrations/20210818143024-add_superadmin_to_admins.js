'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        //await queryInterface.removeColumn('admins', 'role');

        await queryInterface.addColumn('admins', 'role', {
            type: Sequelize.ENUM,
            values: ['admin', 'superAdmin'],
            defaultValue: 'admin'
        });
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.removeColumn('admins', 'role');
    }
};
