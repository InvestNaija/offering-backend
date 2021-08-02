module.exports = (sequelize, Sequelize) => {
    const BvnData = sequelize.define('bvnData', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        bvn: {
            type: Sequelize.STRING,
            allowNull: false
        },

        firstName: {
            type: Sequelize.STRING
        },

        middleName: {
            type: Sequelize.STRING
        },

        lastName: {
            type: Sequelize.STRING
        },

        email: {
            type: Sequelize.STRING
        },

        phoneNumber: {
            type: Sequelize.STRING
        },

        dateOfBirth: {
            type: Sequelize.DATE
        },

        image: {
            type: Sequelize.STRING
        }
    })

    BvnData.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());

        delete values.password;
        return values;
    }

    return BvnData;
}