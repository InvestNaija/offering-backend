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
            queryInterface.addColumn('admins', 'createdBy', {
                type: Sequelize.UUID,
                defaultValue: null,
            }),
            queryInterface.addColumn('admins', 'updatedBy', {
                type: Sequelize.UUID,
                defaultValue: null,
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
            queryInterface.removeColumn('admins', 'createdBy'),
            queryInterface.removeColumn('admins', 'updatedBy')
        ]);
    }
};
