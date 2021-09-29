'use strict';

const fs = require('fs');
const path = require('path');
const {Sequelize} = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
// sequelize = new Sequelize(process.env.POSTGRESS_CLOUD_URL);
// sequelize = new Sequelize('chapel-hill-test', 'postgres', 'rhap95', {
//   host: 'localhost',
//   dialect: 'postgres',
//   pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000
//     }
// })

// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });

// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.customers = require('../users/models/customer')(sequelize, Sequelize);
db.wallets = require('../finance/models/wallet')(sequelize, Sequelize);
db.tokens = require('../auth/token')(sequelize, Sequelize);
db.admins = require('../users/models/admin')(sequelize, Sequelize);
db.brokers = require('../users/models/broker')(sequelize, Sequelize);
db.assets = require('../asset/models/asset')(sequelize, Sequelize);
db.reservations = require('../asset/models/reservation')(sequelize, Sequelize);
db.transactions = require('../finance/models/transaction')(sequelize, Sequelize);
db.cscsLogs = require('../users/models/cscsLogs')(sequelize, Sequelize);
db.kycDocuments = require('../users/models/kycDocuments')(sequelize, Sequelize);
db.bvnData = require('../users/models/bvnData')(sequelize, Sequelize);
db.assetsBankDetails = require('../asset/models/assetBankDetails')(sequelize, Sequelize);
db.roles = require('../users/models/role')(sequelize, Sequelize);
db.admin_roles = require('../users/models/admin_roles')(sequelize, Sequelize);
db.emailLogs = require('./email_log');
db.allotments = require('../finance/models/allotment')(sequelize, Sequelize);

db.wallets.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.wallets.belongsTo(db.brokers, {
  foreignKey: "brokerId",
  as: "broker"
})

db.customers.belongsTo(db.brokers, {
    foreignKey: "brokerId",
    as: "broker"
})

db.reservations.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.reservations.belongsTo(db.assets, {
    foreignKey: "assetId",
    as: "asset"
})

db.reservations.belongsTo(db.brokers, {
    foreignKey: "brokerId",
    as: "broker"
})

db.transactions.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.transactions.belongsTo(db.brokers, {
    foreignKey: "brokerId",
    as: "broker"
})

db.transactions.belongsTo(db.assets, {
    foreignKey: "assetId",
    as: "asset"
})

db.tokens.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.tokens.belongsTo(db.brokers, {
    foreignKey: "brokerId",
    as: "broker"
})

db.tokens.belongsTo(db.admins, {
    foreignKey: "adminId",
    as: "admin"
})

db.cscsLogs.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.kycDocuments.belongsTo(db.customers, {
    foreignKey: "customerId",
    as: "customer"
})

db.assetsBankDetails.belongsTo(db.assets, {
    foreignKey: "assetId",
    as: "asset"
})

db.admins.belongsToMany(db.roles, {
    through: 'admin_roles'
})

db.roles.belongsToMany(db.admins, {
    through: 'admin_roles'
})

db.sequelize.authenticate().then(() => console.log('PstgrsDb connected....')).catch(err => console.log('Error connecting to pstgrsDb...', err))

module.exports = db;
