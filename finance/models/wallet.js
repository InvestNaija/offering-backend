// const Sequelize = require('sequelize');
// const db = require('../../config/sequelize');
// const Customer = require('../../users/models/customer');


module.exports = (sequelize, Sequelize) => {
    const Wallet = sequelize.define('wallet', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },
    
        balance: {
            type: Sequelize.FLOAT,
            
            defaultValue: 0
        }
    })
    Wallet.associate = (models) => {
        Wallet.belongsTo(models.customers, {
            foreignKey: "customerId",
            as: "customer"
        })

        Wallet.belongsTo(models.brokers, {
            foreignKey: "brokerId",
            as: "broker"
        })
    }
    return Wallet;
  };
// const Wallet = db.define('wallet', {
//     id: {
//         allowNull: false,
//         primaryKey: true,
//         type: Sequelize.UUID,
//         defaultValue: Sequelize.UUIDV4
//     },

//     balance: {
//         type: Sequelize.INTEGER,
        
//         defaultValue: 0
//     },

//     customerId: {
//         type: Sequelize.UUID,
//         allowNull: false,
//         references: {
//             model: Customer,
//             key: 'id'
//         }
//     }
// })

// Wallet.belongsTo(Customer,  {as: 'customer', foreignKey: 'customerId'});
// module.exports = Wallet;