import Joi from 'joi';

export const loginSchema = Joi.object({
  login: Joi.string().required().messages({
    'string.empty': 'Login nie może być pusty',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Hasło musi mieć minimum 6 znaków',
  }),
});

export const registerSchema = Joi.object({
  login: Joi.string().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  role: Joi.string().valid('RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR').required(),
});
