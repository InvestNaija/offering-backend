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
            queryInterface.addColumn('bvnData', 'createdAt', {
                type: Sequelize.DATE
            }),
            queryInterface.addColumn('bvnData', 'updatedAt', {
                type: Sequelize.DATE,
                allowNull: true
            }),
            queryInterface.addColumn('bvnData', 'deletedAt', {
                type: Sequelize.DATE,
                allowNull: true
            }),
            queryInterface.addColumn('bvnData', 'customerId', {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            }),
            queryInterface.addColumn('bvnData', 'adminId', {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            }),
            queryInterface.changeColumn('bvnData', 'image',{
                type: Sequelize.TEXT
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
            queryInterface.removeColumn('bvnData', 'createdAt'),
            queryInterface.removeColumn('bvnData', 'updatedAt'),
            queryInterface.removeColumn('bvnData', 'deletedAt'),
            queryInterface.removeColumn('bvnData', 'customerId'),
            queryInterface.removeColumn('bvnData', 'adminId')
        ]);
    }
};
