import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '../../middleware/error-middleware';
import { AppError } from '../../lib/error-handler';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Method not allowed',
      'INVALID_METHOD'
    );
  }

  try {
    // Your API logic here
    res.status(200).json({ success: true });
  } catch (error) {
    // Will be caught by withErrorHandler
    throw error;
  }
};

export default withErrorHandler(handler);
