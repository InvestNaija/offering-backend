module.exports = (sequelize, Sequelize) => {
    const Asset = sequelize.define('asset', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        description: Sequelize.STRING,

        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    
        type: {
            type: Sequelize.STRING,
            values: ['ipo', 'commercial-paper'],
            allowNull: false
        },

        anticipatedMaxPrice: Sequelize.INTEGER,

        anticipatedMinPrice: Sequelize.INTEGER,

        sharePrice: {
            type: Sequelize.INTEGER,
            allowNull: false
        },

        availableShares: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },

        openForPurchase: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        openingDate: {
            type: Sequelize.DATE,
            defaultValue: null
        },

        closingDate: {
            type: Sequelize.DATE,
            allowNull: false
        },

        maturityDate: {
            type: Sequelize.DATE,
            defaultValue: null,
        },

        popularity: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },

        image: Sequelize.STRING,

        currency: {
            type: Sequelize.STRING,
            defaultValue: 'NGN',
            allowNull: true
        },

        subaccountId: {
            type: Sequelize.STRING,
            allowNull: true,
        },

        minimumNoOfUnits: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },

        sendReservationEmail: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        paymentLabel: {
            type: Sequelize.STRING,
            defaultValue: null,
        },

        paymentLogo: {
            type: Sequelize.STRING,
            defaultValue: null,
        }
    }, {
        paranoid: true,
        timestamps: true
    })

    Asset.prototype.toJSON =  function () {
        var values = Object.assign({}, this.get());
      
        delete values.password;
        return values;
      }
  
    return Asset;
  };