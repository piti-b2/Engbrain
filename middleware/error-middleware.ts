import { NextApiRequest, NextApiResponse } from 'next';
import { handleApiError } from '../lib/error-handler';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export const withErrorHandler = (handler: ApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, res, {
        url: req.url,
        method: req.method,
        query: req.query,
        // Don't log sensitive body data
        body: process.env.NODE_ENV === 'production' ? undefined : req.body
      });
    }
  };
};
