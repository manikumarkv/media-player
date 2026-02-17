import { type Request, type Response, type NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';
import { ValidationError } from '../errors/index.js';

type ValidationTarget = 'body' | 'query' | 'params';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validate<T extends ZodType<any, any, any>>(
  schema: T,
  target: ValidationTarget = 'body'
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.parse(data);
      // Replace with validated/transformed data
      (req[target] as unknown) = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
}

export function validateMultiple(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemas: Partial<Record<ValidationTarget, ZodType<any, any, any>>>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      for (const [target, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[target as ValidationTarget];
            const result = schema.parse(data);
            (req[target as ValidationTarget] as unknown) = result;
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(
                ...error.errors.map((e) => `${target}.${e.path.join('.')}: ${e.message}`)
              );
            }
          }
        }
      }

      if (errors.length > 0) {
        next(new ValidationError(errors.join(', ')));
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
