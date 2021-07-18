const express = require('express');
const app = express();
const AppError = require('./config/appError');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const xmlParser = require('express-xml-bodyparser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const errorHandler = require('./config/errorController');
const customerRouter = require('./routes/customerRoutes');
const verificationRouter = require('./routes/verificationRoutes');
const authenticationRouter = require('./routes/authRoutes');
const assetRouter = require('./routes/assetRoutes');
const transactionRouter = require('./routes/transactionRoutes');
const reservationRouter = require('./routes/reservationRoutes');
const brokerRouter = require('./routes/brokerRoutes');
const investmentRouter = require('./routes/investmentRoutes');
const mtnRouter = require('./routes/mtnRoutes');
const log = require('./log/logController');


// define route to swagger document
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());
app.options('*', cors());
app.use(helmet());

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(xmlParser());
app.use(morgan('short'));
app.all('*', log.logRequest);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/verifications', verificationRouter);
app.use('/api/v1/auth', authenticationRouter);
app.use('/api/v1/assets', assetRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/brokers', brokerRouter);
app.use('/api/v1/mtn', mtnRouter);
app.use('/api/v1/investments', investmentRouter);

app.get('/', (req, res, next) => {
    res.send('Hello CHD');
})

app.use((req, res, next) => log.logResponse(req, res, next));

app.use((req, res, next)=>{
    let err = new AppError(`${req.ip} tried to reach a resource at ${req.originalUrl} that is not on this server.`, 404);
    next(err);
});
app.use(errorHandler);
module.exports = app;