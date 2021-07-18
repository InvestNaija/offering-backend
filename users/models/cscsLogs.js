module.exports = (sequelize, Sequelize) => {
    const cscsLog = sequelize.define('cscsLogs', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        request: Sequelize.STRING(1000),

        response: Sequelize.STRING(1000)
    })

    return cscsLog;
};