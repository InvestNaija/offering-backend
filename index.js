require('dotenv').config();
const db = require('./models/index');
require('./config/mongoose');
const app = require('./app');
const jobs = require('./config/jobs');
const PORT = process.env.PORT || 2100;
// db.sequelize.sync({}).then(() => {
//     console.log("re-sync db.");
// });

app.listen(PORT, () => {
    console.log('Server running on ', PORT);
})


// jobs.checkCSCSCreation.start();
// jobs.checkCSCSCreation.start();
jobs.updateTransactionsWithAssetId.start();

process.on('uncaughtException', err => {
    console.log('Uncaught Exception!! Shutting down process..', err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', err=>{
    console.log('Unhandled Rejection!!',err.code, err.name, err.message, err.stack);
    process.exit(1);
});