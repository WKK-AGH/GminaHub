import Joi from 'joi';

export const createSessionSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Tytuł sesji musi mieć co najmniej 5 znaków',
    'any.required': 'Tytuł sesji jest wymagany',
  }),
  scheduledDate: Joi.date().greater('now').required().messages({ // Poprawione z scheduledAt na scheduledDate
    'date.greater': 'Data sesji musi być zaplanowana w przyszłości',
    'any.required': 'Data i godzina sesji są wymagane',
  }),
  committeeId: Joi.number().integer().positive().optional().messages({ // Poprawione z string().uuid() na number()
    'number.base': 'Identyfikator komisji musi być liczbą',
  }),
  quorumRequired: Joi.number().integer().positive().required().messages({
    'any.required': 'Wymagane quorum jest wymagane',
    'number.base': 'Quorum musi być liczbą',
  }),
});
