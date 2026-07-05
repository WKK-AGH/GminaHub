import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email nie może być pusty',
    'string.email': 'Podaj poprawny adres e-mail',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Hasło musi mieć minimum 6 znaków',
  }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Podaj poprawny adres e-mail',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Hasło musi mieć minimum 6 znaków',
  }),
  firstName: Joi.string().min(2).required().messages({
    'any.required': 'Imię jest wymagane',
  }),
  lastName: Joi.string().min(2).required().messages({
    'any.required': 'Nazwisko jest wymagane',
  }),
  role: Joi.string().required().messages({
    'any.required': 'Rola jest wymagana',
  }),
});
