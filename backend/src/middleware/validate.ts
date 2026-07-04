import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import Joi from 'joi'; // Upewnij się, że Joi jest zaimportowany

export const validateBody = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      res.status(400).json({ success: false, message: `Błąd walidacji: ${errorMessage}` });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  const { error } = Joi.number().integer().positive().required().validate(id);

  if (error) {
    res.status(400).json({
      success: false,
      message: 'Identyfikator w adresie URL musi być poprawną liczbą całkowitą',
    });
    return;
  }
  next();
};
