module.exports = (sequelize, Sequelize) => {
    const Customer = sequelize.define('customer', {
        accountType: {
            type: Sequelize.ENUM,
            values: ['direct', 'broker', 'mtn'],
            defaultValue: 'direct'
        },

        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
        },

        description: Sequelize.STRING,
    
        firstName: {
            type: Sequelize.STRING,
            allowNull: false
        },
    
        lastName: {
            type: Sequelize.STRING,
            allowNull: false
        },

        middleName: Sequelize.STRING,

        bvn: {
            type: Sequelize.STRING
        },

        nin: {
            type: Sequelize.STRING
        },

        address: {
            type: Sequelize.STRING,
            allowNull: false
        },
    
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
    
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
    
        gender: {
            type: Sequelize.ENUM,
            values: ['male', 'female', 'other'],
            allowNull: false
        },
    
        dob: {
            type: Sequelize.DATE,
            allowNull: false
        },
    
        phone: {
            type: Sequelize.STRING,
            allowNull: false
        },
    
        cscs: {
            type: Sequelize.STRING,
            unique: true
        },
    
        chn: Sequelize.STRING,

        cscsRef: {
            type: Sequelize.STRING,
            unique: true
        },

        cscsVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        cscsRequestStatus: {
            type: Sequelize.ENUM,
            values: ['inactive', 'requested', 'request-failure'],
            defaultValue: 'inactive'
        },

        cscsRequestFailureReason: Sequelize.STRING,

        role: {
            type: Sequelize.ENUM,
            values: ['customer'],
            defaultValue: 'customer'
        },

        verified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        accountDetailsVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },

        status: {
            type: Sequelize.ENUM,
            values: ['active', 'inactive', 'deactivated'],
            defaultValue: 'inactive'
        },

        accessAuditId: Sequelize.STRING,

        bankAccountName: Sequelize.STRING,

        bankName: Sequelize.STRING,

        bankCode: Sequelize.STRING,

        nuban: Sequelize.STRING,

        zanibalId: Sequelize.STRING,

        image: Sequelize.STRING,

        driverLicense: Sequelize.STRING,

        driverLicenseNo: Sequelize.STRING,

        passport: Sequelize.STRING,

        passportNo: Sequelize.STRING,

        nationalId: Sequelize.STRING,

        nationalIdNo: Sequelize.STRING,

        utility: Sequelize.STRING,

        utilityNo: Sequelize.STRING,

        website: Sequelize.STRING,

        twitter: Sequelize.STRING,

        facebook: Sequelize.STRING,

        linkedIn: Sequelize.STRING,

        youtube: Sequelize.STRING,

        zanibalPortfolioId: {
            type: Sequelize.STRING,
            allowNull: true
        },

        nextOfKinName: {
            type: Sequelize.STRING,
            allowNull: true
        },

        nextOfKinPhoneNumber: {
            type: Sequelize.STRING,
            allowNull: true
        },

        nextOfKinEmail: {
            type: Sequelize.STRING,
            allowNull: true
        },

        nextOfKinRelationship: {
            type: Sequelize.STRING,
            allowNull: true
        },

        nextOfKinAddress: {
            type: Sequelize.STRING,
        },

        mothersMaidenName: {
            type: Sequelize.STRING,
        },

        placeOfBirth: {
            type: Sequelize.STRING
        }
    })

    Customer.prototype.toJSON =  function () {
        var values = Object.assign({}, this.get());
      
        delete values.password;
        return values;
    }

    Customer.associate = (models) => {
        Customer.hasMany(models.reservations, {
            as: 'reservations'
        })

        Customer.hasOne(models.wallets, {
            as: 'wallet'
        })

        Customer.hasMany(models.transactions, {
            as: 'transactions'
        })

        Customer.hasMany(models.cscsLogs, {
            as: 'cscsLogs'
        })

        Customer.belongsTo(models.brokers, {
            foreignKey: 'brokerId',
            as: 'broker'
        })

        Customer.hasMany(models.kycDocuments, {
            as: 'kycDocuments'
        })

        Customer.hasOne(models.bvnData, {
            as: 'bvnData'
        })
    }
  
    return Customer;
  };

