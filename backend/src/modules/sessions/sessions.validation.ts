import Joi from 'joi';

export const createSessionSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Tytuł sesji musi mieć co najmniej 5 znaków',
    'any.required': 'Tytuł sesji jest wymagany',
  }),
  scheduledAt: Joi.date().greater('now').required().messages({
    'date.greater': 'Data sesji musi być zaplanowana w przyszłości',
    'any.required': 'Data i godzina sesji są wymagane',
  }),
  committeeId: Joi.string().uuid().optional(),
});
