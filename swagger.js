const swaggerAutoGen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Invest Naija APIs',
        description: 'Collection of API endpoints for Invest Naija and E-IPO application',
    },
    host: 'localhost:2100',
    schemes: ['http'],
    consumes: [],  // by default: ['application/json']
    produces: [],  // by default: ['application/json']
    tags: [        // by default: empty Array
        {
            name: 'Invest Naija APIs',         // Tag name
            description: 'Collection of API endpoints for Invest Naija and E-IPO application',  // Tag description
        },
        // { ... }
    ],
    securityDefinitions: {},  // by default: empty object
    definitions: {},
};

const outputFile = './swagger-output.json';
const endpointFiles = ['./app.js'];

swaggerAutoGen(outputFile, endpointFiles, doc);