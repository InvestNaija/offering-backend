module.exports = (sequelize, Sequelize) => {
    const Reservation = sequelize.define('reservation', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        unitsExpressed: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },

        unitsAlloted: {
            type: Sequelize.FLOAT,
            defaultValue: 0
        },

        unitsRefund: {
            type: Sequelize.FLOAT,
            defaultValue: 0
        },

        amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },

        paid: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        refund: {
            type: Sequelize.ENUM,
            values: ['non', 'pending', 'refunded'],
            defaultValue: 'non'
        },

        status: {
            type: Sequelize.ENUM,
            values: ['pending', 'alloted', 'paid', 'cancelled'],
            defaultValue: 'pending'
        },

        reinvest: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        paranoid: true,
        timestamps: true
    })

    Reservation.prototype.toJSON =  function () {
        var values = Object.assign({}, this.get());
      
        delete values.password;
        return values;
      }
  
    return Reservation;
  };