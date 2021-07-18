'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.createTable('brokers', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },

            type: {
                type: Sequelize.ENUM,
                values: ['normal'],
                defaultValue: 'normal'
            },

            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },

            phone: {
                type: Sequelize.STRING,
                allowNull: false
            },

            address: {
                type: Sequelize.STRING,
                allowNull: false
            },

            password: {
                type: Sequelize.STRING,
                allowNull: false
            },

            image: Sequelize.STRING,

            role: {
                type: Sequelize.ENUM,
                values: ['broker'],
                defaultValue: 'broker'
            },

            verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },

            passwordUpdated: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },

            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },

            walletId: {
                type: Sequelize.UUID,
                references: {
                    model: 'wallets',
                    key: 'id',
                    as: 'wallet'
                }
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
        await queryInterface.dropTable('brokers');
    }
};
