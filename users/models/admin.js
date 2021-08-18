module.exports = (sequelize, Sequelize) => {
    const Admin = sequelize.define('admin', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4
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

        firstName: {
            type: Sequelize.STRING
        },
    
        lastName: {
            type: Sequelize.STRING
        },

        dob: Sequelize.DATE,

        country: Sequelize.STRING,

        phone: Sequelize.STRING,
    
        image: Sequelize.STRING,
    
        role: {
            type: Sequelize.ENUM,
            values: ['admin', 'superAdmin'],
            defaultValue: 'admin'
        },

        createdBy: {
            type: Sequelize.UUID,
            defaultValue: null,
        },

        updatedBy: {
            type: Sequelize.UUID,
            defaultValue: null,
        }
    })

    Admin.prototype.toJSON =  function () {
        var values = Object.assign({}, this.get());
      
        delete values.password;
        return values;
    }
    
    return Admin;
  };