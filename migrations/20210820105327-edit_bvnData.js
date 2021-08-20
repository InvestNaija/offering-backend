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
            queryInterface.addColumn('bvnData', 'maritalStatus', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'lgaOfResidence', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'lgaOfOrigin', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'residentialAddress', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'stateOfOrigin', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'enrollmentBank', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'enrollmentBranch', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'nameOnCard', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'title', {
                type: Sequelize.STRING
            }),
            queryInterface.addColumn('bvnData', 'levelOfAccount', {
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
        await Promise.all([
            queryInterface.removeColumn('bvnData', 'maritalStatus'),
            queryInterface.removeColumn('bvnData', 'lgaOfResidence'),
            queryInterface.removeColumn('bvnData', 'lgaOfOrigin'),
            queryInterface.removeColumn('bvnData', 'residentialAddress'),
            queryInterface.removeColumn('bvnData', 'stateOfOrigin'),
            queryInterface.removeColumn('bvnData', 'enrollmentBank'),
            queryInterface.removeColumn('bvnData', 'enrollmentBranch'),
            queryInterface.removeColumn('bvnData', 'nameOnCard'),
            queryInterface.removeColumn('bvnData', 'title'),
            queryInterface.removeColumn('bvnData', 'levelOfAccount')
        ])
    }
};
