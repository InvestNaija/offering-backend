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
            queryInterface.renameColumn('kyc_documents', 'documentName', 'name'),
            queryInterface.renameColumn('kyc_documents', 'documentType', 'value'),
            queryInterface.removeColumn('kyc_documents', 'location')
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
            queryInterface.renameColumn('kyc_documents', 'name', 'documentName'),
            queryInterface.renameColumn('kyc_documents', 'value', 'documentType'),
            queryInterface.addColumn('kyc_documents', 'location', {
              type: Sequelize.TEXT,
              allowNull: true
            })
        ]);
    }
};
