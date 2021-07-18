'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        return await queryInterface.createTable('kyc_documents', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },

            documentName: {
                type: Sequelize.STRING
            },

            documentType: {
                type: Sequelize.STRING
            },

            location: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            createdAt: {
                type: Sequelize.DATE
            },

            updatedAt: {
                type: Sequelize.DATE
            },

            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },

            //define foreign key
            customerId: {
                type: Sequelize.UUID,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'cascade',
                onDelete: 'cascade'
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
        return await queryInterface.dropTable('kyc_documents')
    }
};
