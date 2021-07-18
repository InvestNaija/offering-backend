'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('customers', {
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
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
        allowNull: false,
        unique: true
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

    status: {
        type: Sequelize.ENUM,
        values: ['active', 'inactive', 'deactivated'],
        defaultValue: 'inactive'
    },

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

    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },

    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    },

    brokerId: {
      type: Sequelize.UUID,
      references: {
        model: 'brokers',
        key: 'id',
        as: 'broker'
      }
    }

    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('customers');
  }
};
