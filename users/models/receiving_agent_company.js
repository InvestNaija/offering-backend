module.exports = (sequelize, Sequelize) => {
    const receiving_agent_company = sequelize.define('receiving_agent_company', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        name: {
            type: Sequelize.STRING,
            defaultValue: null
        },

        email: {
            type: Sequelize.STRING
        },

        phoneNumber: {
            type: Sequelize.STRING
        },

        code: {
            type: Sequelize.STRING
        },

        organizationType: {
            type: Sequelize.STRING,
        }
    }, {
        timestamps: true,
        paranoid: true
    })

    receiving_agent_company.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());

        return values;
    }

    return receiving_agent_company;
}