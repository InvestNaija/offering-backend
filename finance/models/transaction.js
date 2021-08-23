module.exports = (sequelize, Sequelize) => {
    const Transaction = sequelize.define('transaction', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        reference: {
            type: Sequelize.STRING,
            allowNull: false
        },

        gatewayReference: Sequelize.STRING,

        description: Sequelize.STRING,

        amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },

        reservation: {
            type: Sequelize.STRING,
        },

        status: {
            type: Sequelize.ENUM,
            values: ['success', 'failed', 'pending'],
            defaultValue: 'pending'
        },

        type: {
            type: Sequelize.ENUM,
            values: ['credit', 'debit']
        },
        //source of transaction, wallet, online, access, ....
        source: {
            type: Sequelize.STRING,
            defaultValue: 'online'
        },
        //transaction channel, tradein, savein, planin, investin, eipo,learning....
        channel: {
            type: Sequelize.STRING,
            defaultValue: 'eipo'
        },

        module: {
            type: Sequelize.STRING,
            allowNull: true,
        },

        momoAgentId: Sequelize.STRING,
    }, {
        timestamps: true,
        paranoid: true
    })



    Transaction.associate = (models) => {
        Transaction.belongsTo(models.customers, {
            foreignKey: "customerId",
            as: "customer"
        })

        Transaction.belongsTo(models.brokers, {
            foreignKey: "brokerId",
            as: "broker"
        })
    }
    return Transaction;
};
