const db = require('../../models/index');
const AppError = require('../../config/appError');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/authController');
const Admin = db.admins;
const Role = db.roles;
const cloudinary = require('../../config/cloudinary');
const admin_roles = db.admin_roles;
const sendEmail = require("../../config/email");
const moment = require("moment");
const { roles } = require('../../models/index');

exports.signup = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) return next(new AppError('email and password required', 400));
        const emailExists = await Admin.findOne({ where: { email } });
        if (emailExists) return next(new AppError('A user is already signed up with this email', 409));
        let hash = bcrypt.hashSync(password, 12);
        const admin = await Admin.create({ email, password: hash });
        let resp = {
            code: 201,
            status: 'success',
            data: admin,
            message: 'Signup success'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        let roles = [];
        if (!email || !password) return next(new AppError('email and password required', 400));
        const user = await Admin.findOne({ where: { email } });
        const adminRole = await admin_roles.findAll({ where: { adminId: user.id } });

        for (const item of adminRole) {
            const roleValue = await Role.findByPk(item.roleId);
            roles.push({ module: roleValue.module, permission: roleValue.permission });
        }

        if (!user) return next(new AppError('User not found', 404));
        const correctPassword = bcrypt.compareSync(password, user.password);
        if (!correctPassword) return next(new AppError('Wrong password entered', 406));
        let signature = {
            id: user.id,
            role: user.role,
            roles: roles
        }

        const token = auth.createAccessToken(signature);

        let resp = {
            code: 200,
            status: 'success',
            data: user,
            message: 'login success',
            token
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.update = async (req, res, next) => {
    try {
        let id = req.query.id;
        if (!id) return next(new AppError('id required', 400));
        let { firstName, lastName, phone, country, dob, image } = req.body;
        dob = new Date(dob);
        let update = { firstName, lastName, phone, country, dob };
        await Admin.update(update, { where: { id } })
        res.status(200).json({
            status: 'success',
            message: 'Profile updated'
        })
        if (image) {
            let response = await cloudinary.uploadImage(image);
            if (response) await Admin.update({ image: response.secure_url }, { id });
            console.log('image updated');
        }
    } catch (error) {
        return next(error);
    }
}

exports.fetch = async (req, res, next) => {
    try {
        let { id } = req.query;
        let admin;
        let admins = [];
        let resp = {
            code: 200,
            status: '',
            message: '',
            data: {}
        }

        // if(!id) return next(new AppError('id required', 400));
        if (id) {
            admin = await Admin.findOne({
                where: { id },
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dob'],
                include: {
                    model: roles,
                    attributes: ['id', 'module', 'permission'],
                    through: {
                        attributes: []
                    }
                }
            });
            if (!admin) return next(new AppError('admin not found', 404));

            resp.code = 200;
            resp.status = 'success';
            resp.message = 'Admin retrieved successfully';
            resp.data = admin;
        } else {
            admins = await Admin.findAll({
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'dob'],
                include: {
                    model: roles,
                    attributes: ['id', 'module', 'permission'],
                    through: {
                        attributes: []
                    }
                }
            });


            resp.code = 200;
            resp.status = 'success';
            resp.message = 'Admin retrieved successfully';
            resp.data = admins;
        }


        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        let { email, baseUrl } = req.body;
        let url = "";
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) return next(new AppError('Admin not found.', 404));
        let tokenStr = crypto.randomBytes(16).toString("hex");
        const token = await Token.create({ token: tokenStr, adminId: admin.id });
        if (!token) return next(new AppError('error creating password reset', 500));

        if (baseUrl) {
            url = `${baseUrl}/auth/reset-password?token-details=${token.token}`;
        } else {
            url = `${process.env.FRONTEND_URL}/auth/reset-password?token-details=${token.token}`;
        }

        let opts = {
            email: admin.email,
            subject: 'Password Reset',
            message: `<p>Hello ${admin.firstName} ${admin.lastName ? admin.lastName : ""},</p>
            <p>Follow this link to reset your account's password:</p>
            <p><a href="${url}">Reset</a></p>
            `
        }

        sendEmail(opts).then(r => {
            console.log('password reset email sent');
            let resp = {
                code: 200,
                status: 'success',
                message: 'Password reset email sent. Please check your mail.'
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            return next();
        }).catch(err => {
            console.log('error sending password reset', err);
            return next(new AppError('Error sending password reset email. Please try again.', 500));
        })
    } catch (err) {
        return next(err);
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        let token = req.params.token;
        if (!token) return next(new AppError('token is required', 400));
        let { password, confirmPassword } = req.body;
        if (!password || !confirmPassword) return next(new AppError('password and confirmPassword is required', 400));
        if (password !== confirmPassword) return next(new AppError('password and confirmPassword do not match', 400));
        const tokenExists = await Token.findOne({ where: { token } });
        if (!tokenExists || tokenExists.used) return next(new AppError('invalid or expired token', 401));
        let adminId = tokenExists.adminId;
        if (!adminId) return next(new AppError('invalid customer', 401));
        let hash = bcrypt.hashSync(password, 12);
        await Admin.update({ password: hash }, { where: { id: adminId } });
        let resp = {
            code: 200,
            status: 'success',
            message: 'Password reset successful.'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        return next(err);
    }
}

exports.changePassword = async (req, res, next) => {
    try {
        let id = req.user.id
        let { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return next(new AppError('New and old passwords required', 406));
        const admin = await Admin.findByPk(id);
        const confirmedPassword = bcrypt.compareSync(oldPassword, admin.password);
        if (!confirmedPassword) return next(new AppError('Incorrect old password entered', 401));
        let hash = bcrypt.hashSync(newPassword, 12);
        await Admin.update({ password: hash }, { where: { id } });
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker Password updated'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('ChangePassword Error: ', err);
        return next(err);
    }
}

exports.assignToRole = async (req, res, next) => {
    try {
        let adminId = req.params.id;
        let { addRoles, removeRoles } = req.body;
        let resp;
        let newAdminRole;

        const admin = await Admin.findByPk(adminId);

        if (!admin) {
            return next(new AppError('Admin does not exist', 400));
        }

        // add admin to roles
        if (addRoles) {
            for (const role of addRoles) {
                const foundRole = await Role.findByPk(role.roleId);

                if (!foundRole) {
                    return next(new AppError('Role does not exist', 400));
                }

                newAdminRole = await admin_roles.create({ adminId, roleId: foundRole.id });
            }

            resp = {
                code: 201,
                status: 'success',
                message: 'Admin added to role successfully',
                data: newAdminRole,
            };
        }

        if (removeRoles) {
            // remove admin from roles
            for (const role of removeRoles) {
                await admin_roles.destroy({ where: { roleId: role.roleId } });
            }

            resp = {
                code: 204,
                status: 'success',
                message: 'Admin removed from role successfully',
                data: newAdminRole,
            };
        }


        res.status(resp.code).json(resp);
        res.locals.resp = resp;

        return next();
    } catch (err) {
        console.error('Assign to Role Error: ', err);
        return next(err);
    }
}

exports.createAdminUser = async (req, res, next) => {
    try {
        let { firstname, lastname, phone, email, dob, addRoles, removeRoles } = req.body;
        let newAdminUser;
        let adminId = req.query.id;

        let request = ['firstname', 'lastname', 'email', 'phone', 'dob'];

        let resp = {
            code: 200,
            status: '',
            message: '',
            data: {}
        };

        for (let i = 0; i < request.length; i++) {
            if (!req.body[request[i]] || req.body[request[i]] === "") {
                return next(new AppError(`${request[i]} is required`, 400));
            }
        }

        dob = moment(dob, "DD-MM-YYYY").format();

        if (adminId) {
            await Admin.update({email, firstName: firstname, lastName: lastname, dob, phone}, {where: {id: adminId}});
        } else {
            newAdminUser = await Admin.create({ email, firstName: firstname, lastName: lastname, dob, phone });
        }

        if (newAdminUser && addRoles) {
            // add admin to role
            for (const role of addRoles) {
                const foundRole = await Role.findByPk(role.roleId);

                if (!foundRole) {
                    return next(new AppError('Role does not exist', 400));
                }

                const newAdminRole = await admin_roles.create({ adminId: newAdminUser.id, roleId: foundRole.id });
            }

            resp.code = 201;
            resp.status = 'success';
            resp.message = 'Admin created and added to role successfully';
            resp.data = newAdminUser
        }

        if (newAdminUser && removeRoles) {
            // remove admin from role
            for (const role of removeRoles) {
                await admin_roles.destroy({where: {roleId: role.roleId}});
            }

            resp.code = 204;
            resp.status = 'success';
            resp.message = 'Admin updated and removed from role successfully';
            resp.data = newAdminUser
        }

        res.status(resp.code).json(resp);
        res.locals.resp = resp;

        return next();
    } catch (err) {
        console.error('Create Admin User Error: ', err);
        return next(err);
    }
}