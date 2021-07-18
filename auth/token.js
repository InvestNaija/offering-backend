module.exports = (sequelize, Sequelize) => {
    const Token = sequelize.define('token', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },
        token: {
            type: Sequelize.STRING,
            allowNull: false
        },

        used: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    })

    Token.associate = (models) => {
        Token.belongsTo(models.customers, {
            foreignKey: "customerId",
            as: "customer"
        })

        Token.belongsTo(models.brokers, {
            foreignKey: "brokerId",
            as: "broker"
        })

        Token.belongsTo(models.admins, {
            foreignKey: "adminId",
            as: "admin"
        })
    }
    return Token;
  };