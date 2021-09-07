module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define('role', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        module: {
            type: Sequelize.STRING,
        },

        permission: {
            type: Sequelize.STRING,
            allowNull: false,
        }
    })

    // Role.prototype.toJSON = function () {
    //     let values = Object.assign({}, this.get());
    //
    //     return values;
    // }

    return Role;
}