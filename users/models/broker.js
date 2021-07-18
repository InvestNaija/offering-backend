module.exports = (sequelize, Sequelize) => {
    const Broker = sequelize.define('broker', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        type: {
            type: Sequelize.ENUM,
            values: ['normal'],
            defaultValue: 'normal'
        },

        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },

        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },

        phone: {
            type: Sequelize.STRING,
            allowNull: false
        },

        address: {
            type: Sequelize.STRING,
            allowNull: false
        },

        password: {
            type: Sequelize.STRING,
            allowNull: false
        },

        image: Sequelize.STRING,

        role: {
            type: Sequelize.ENUM,
            values: ['broker'],
            defaultValue: 'broker'
        },

        verified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        passwordUpdated: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    })

    Broker.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        delete values.password;
        return values;
    }

    Broker.associate = (models) => {
        Broker.hasOne(models.wallets, {
            as: 'wallet'
        })

        Broker.hasMany(models.customers, {
            as: 'customers'
        })
    }

    return Broker;
};