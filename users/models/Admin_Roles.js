module.exports = (sequelize, Sequelize) => {
    const admin_roles = sequelize.define('admin_roles', {
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

    return admin_roles;
}