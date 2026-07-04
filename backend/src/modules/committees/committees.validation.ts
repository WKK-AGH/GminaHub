import Joi from 'joi';

export const createCommitteeSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Nazwa komisji musi mieć co najmniej 3 znaki',
    'string.max': 'Nazwa komisji może mieć maksymalnie 100 znaków',
    'any.required': 'Nazwa komisji jest wymagana',
  }),
});

export const addMemberSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    'number.base': 'Niepoprawny identyfikator użytkownika. Musi być liczbą.',
    'any.required': 'Identyfikator użytkownika jest wymagany',
  }),
});
