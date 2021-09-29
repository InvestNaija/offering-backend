module.exports = (sequelize, Sequelize) => {
    const Allotment = sequelize.define('allotment', {
        id: {
            primaryKey: true,
            allowNull: false,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        batch: Sequelize.INTEGER,

        customerName: {
            type: Sequelize.STRING,
            defaultValue: null,
        },

        assetName: {
            type: Sequelize.STRING,
            defaultValue: null,
        },

        sharePrice: Sequelize.FLOAT,

        allotedUnits: Sequelize.FLOAT,

        allotedAmount: Sequelize.FLOAT,

        allotmentRefund: Sequelize.FLOAT,

        customerTotalPurchase: Sequelize.FLOAT,

        processed: Sequelize.BOOLEAN,

        emailSent: Sequelize.BOOLEAN,
    }, {
        paranoid: true,
        timestamps: true
    });

    Allotment.associate = (models) => {
        Allotment.belongsTo(models.assets, {
            foreignKey: "assetId",
            as: "customer"
        })

        Allotment.belongsTo(models.transactions, {
            foreignKey: "transactionId",
            as: "transaction"
        })

        Allotment.belongsTo(models.customers, {
            foreignKey: "customerId",
            as: "customer"
        })
    }

    return Allotment;
}