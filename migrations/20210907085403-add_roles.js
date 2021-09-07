'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        await queryInterface.createTable('roles', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },

            module: {
                type: Sequelize.STRING
            },

            permission: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            createdAt: {
              type: Sequelize.DATE
            },

            updatedAt: {
              allowNull: true,
              type: Sequelize.DATE
            },

            deletedAt: {
              type: Sequelize.DATE,
              allowNull: true,
            }
        })
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.dropTable('roles');
    }
};
