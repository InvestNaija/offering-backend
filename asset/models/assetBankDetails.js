module.exports = (sequelize, Sequelize) => {
    const AssetBankDetails = sequelize.define('', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        bankName: {
            type: Sequelize.STRING,
            defaultValue: null,
        },

        accountNumber: {
            type: Sequelize.STRING,
            defaultValue: null
        }
    }, {
        paranoid: true,
        timestamps: true,
        tableName: 'assetBankDetails'
    })

    AssetBankDetails.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        return values;
    }

    return AssetBankDetails;
}