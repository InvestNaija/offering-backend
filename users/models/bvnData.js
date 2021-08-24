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
            type: Sequelize.TEXT
        },

        maritalStatus: Sequelize.STRING,

        lgaOfResidence: Sequelize.STRING,

        lgaOfOrigin: Sequelize.STRING,

        residentialAddress: Sequelize.STRING,

        stateOfOrigin: Sequelize.STRING,

        enrollmentBank: Sequelize.STRING,

        enrollmentBranch: Sequelize.STRING,

        nameOnCard: Sequelize.STRING,

        title: Sequelize.STRING,

        levelOfAccount: Sequelize.STRING,

        gender: Sequelize.STRING
    }, {
        paranoid: true,
        timestamps: true
    })

    BvnData.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());

        delete values.password;
        return values;
    }

    return BvnData;
}