module.exports = (sequelize, Sequelize) => {
    const Admin_Roles = sequelize.define('Admin_Roles', {
        adminId: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        roleId: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        }
    }, {
        timestamps: true,
    })
}