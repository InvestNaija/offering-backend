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
            queryInterface.createTable('assetBankDetails', {
                id: {
                    allowNull: false,
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4
                },

                bankName: {
                    type: Sequelize.STRING,
                    defaultValue: null,
                },

                accountNumber: {
                    type: Sequelize.STRING,
                    defaultValue: null
                },

                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },

                updatedAt: {
                    allowNull: true,
                    type: Sequelize.DATE,
                    defaultValue: null
                },

                deletedAt: {
                    allowNull: true,
                    type: Sequelize.DATE,
                    defaultValue: null
                },

                assetId: {
                    type: Sequelize.UUID,
                    references: {
                        model: 'assets',
                        key: 'id',
                        as: 'asset'
                    }
                }
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
        await queryInterface.dropTable('assetBankDetails')
    }
};
