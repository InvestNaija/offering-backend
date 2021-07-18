module.exports = (sequelize, Sequelize) => {
    const KycDocument = sequelize.define('kyc_documents', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        name: {
            type: Sequelize.STRING
        },

        value: {
            type: Sequelize.STRING
        }

    }, {
        paranoid: true,
        timestamps: true
    })

    KycDocument.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());

        return values;
    }

    KycDocument.associate = (models) => {
        KycDocument.belongsTo(models.customers, {
            as: 'customer'
        })
    }

    return KycDocument;
}