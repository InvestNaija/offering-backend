// const Sequelize = require('sequelize');

// const sequelize = new Sequelize(process.env.POSTGRESS_CLOUD_URL);

// const sequelize = new Sequelize('chapel-hill-test', 'postgres', 'rhap95', {
//     host: 'localhost',
//     dialect: 'postgres',
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//       }
// })
// const db = {};

// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// db.customers = require('../users/models/customer')(sequelize, Sequelize);
// db.wallets = require('../finance/models/wallet')(sequelize, Sequelize);
// db.tokens = require('../auth/token')(sequelize, Sequelize);
// db.admins = require('../users/models/admin')(sequelize, Sequelize);
// db.brokers = require('../users/models/broker')(sequelize, Sequelize);
// db.assets = require('../asset/models/asset')(sequelize, Sequelize);
// db.reservations = require('../asset/models/reservation')(sequelize, Sequelize);
// db.transactions = require('../finance/models/transaction')(sequelize, Sequelize);

// db.wallets.belongsTo(db.customers, {
//     foreignKey: "customerId",
//     as: "customer"
// })

// db.customers.belongsTo(db.brokers, {
//     foreignKey: "brokerId",
//     as: "broker"
// })

// db.reservations.belongsTo(db.customers, {
//     foreignKey: "customerId",
//     as: "customer"
// })

// db.reservations.belongsTo(db.assets, {
//     foreignKey: "assetId",
//     as: "asset"
// })

// db.transactions.belongsTo(db.customers, {
//     foreignKey: "customerId",
//     as: "customer"
// })

// db.tokens.belongsTo(db.customers, {
//     foreignKey: "customerId",
//     as: "customer"
// })

// db.sequelize.authenticate().then(() => console.log('PstgrsDb connected....')).catch(err => console.log('Error connecting to pstgrsDb...', err))

// module.exports = db;