import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

const analysisRequestSchema = Joi.object({
  targetKeyword: Joi.string().min(1).max(200).required(),
  userPageUrl: Joi.string().uri().required(),
  competitorUrls: Joi.array().items(Joi.string().uri()).max(10).optional()
});

export const validateAnalysisRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { error } = analysisRequestSchema.validate(req.body);
  
  if (error) {
    throw new AppError(
      error.details[0].message,
      400,
      'VALIDATION_ERROR'
    );
  }
  
  next();
};