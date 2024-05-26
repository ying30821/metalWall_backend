const validator = require('validator');
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const { handleSuccessWithData, createAppError } = require('../service/handler');
const { generateToken } = require('../service/auth');

const users = {
  async signUp(req, res, next) {
    const fields = [
      { field: 'name', type: 'string' },
      { field: 'email', type: 'string' },
      { field: 'password', type: 'string' },
      { field: 'confirm_password', type: 'string' },
    ];
    const { name, email, password, confirm_password } = req.body;
    if (!name || !email || !password || !confirm_password)
      return next(
        createAppError(
          400,
          'Validation Failed: One or more required fields are missing'
        )
      );
    fields.forEach(({ field, type }) => {
      if (typeof req.body[field] !== type) {
        return next(createAppError(400, `"${field}" must be a ${type}`));
      }
    });
    if (password !== confirm_password)
      return next(
        createAppError(
          400,
          'Validation Failed: Confirm password is not equal to password'
        )
      );
    if (!validator.isLength(password, { min: 8 }))
      return next(
        createAppError(
          400,
          'Validation Failed: Password must be at least eight characters'
        )
      );
    if (!validator.isEmail(email))
      return next(
        createAppError(400, 'Validation Failed: Invalid email format')
      );
    const isExistEmail = (await User.find({ email })).length > 0;
    if (isExistEmail)
      return next(createAppError(409, 'Conflict: The account already exists'));
    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
    });
    const token = generateToken(newUser._id);
    handleSuccessWithData(res, {
      user: { name: newUser.name, token },
    });
  },
  async signIn(req, res, next) {
    const fields = [
      { field: 'email', type: 'string' },
      { field: 'password', type: 'string' },
    ];
    const { email, password } = req.body;
    if (!email || !password)
      return next(
        createAppError(
          400,
          'Validation Failed: One or more required fields are missing'
        )
      );
    fields.forEach(({ field, type }) => {
      if (typeof req.body[field] !== type) {
        return next(createAppError(400, `"${field}" must be a ${type}`));
      }
    });
    if (!validator.isEmail(email))
      return next(
        createAppError(400, 'Validation Failed: Invalid email format')
      );
    const user = await User.findOne({ email }).select('+password');
    const auth = await bcrypt.compare(password, user.password);
    if (!auth)
      return next(createAppError(401, 'Unauthorized: Incorrect password'));
    const token = generateToken(user._id);
    handleSuccessWithData(res, {
      user: {
        name: user.name,
        token,
      },
    });
  },
  async updatePassword(req, res, next) {
    const fields = [
      { field: 'password', type: 'string' },
      { field: 'confirm_password', type: 'string' },
    ];
    const { password, confirm_password } = req.body;
    if (!password || !confirm_password)
      return next(
        createAppError(
          400,
          'Validation Failed: One or more required fields are missing'
        )
      );
    fields.forEach(({ field, type }) => {
      if (typeof req.body[field] !== type) {
        return next(createAppError(400, `"${field}" must be a ${type}`));
      }
    });
    if (password !== confirm_password)
      return next(
        createAppError(
          400,
          'Validation Failed: Confirm password is not equal to password'
        )
      );
    if (!validator.isLength(password, { min: 8 }))
      return next(
        createAppError(
          400,
          'Validation Failed: Password must be at least eight characters'
        )
      );
    const hashPassword = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(req.user.id, {
      password: hashPassword,
    });
    const token = generateToken(user._id);
    handleSuccessWithData(res, {
      user: { name: user.name, token },
    });
  },
  async getProfile(req, res, next) {
    handleSuccessWithData(res, { user: req.user });
  },
};

module.exports = users;
