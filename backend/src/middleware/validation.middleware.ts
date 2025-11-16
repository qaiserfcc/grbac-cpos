import { NextFunction, Request, Response } from 'express';
import {
  Schema,
  checkSchema,
  ValidationChain,
  validationResult,
  ValidationError,
} from 'express-validator';
import { StatusCodes } from 'http-status-codes';

type ValidationSchema = Schema | ValidationChain[];

export function validate(schema: ValidationSchema) {
  const chains = Array.isArray(schema) ? schema : checkSchema(schema);

  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((chain) => chain.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: result.array().map((error) => ({
        field: getErrorParam(error),
        message: error.msg,
      })),
    });
  };
}

function getErrorParam(error: ValidationError) {
  if ('param' in error && error.param) {
    return error.param;
  }
  if ('path' in error && error.path) {
    return error.path;
  }
  return 'unknown';
}
