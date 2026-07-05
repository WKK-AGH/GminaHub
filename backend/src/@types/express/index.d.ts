import { TokenPayload } from '../../utils/helpers/jwt.helper';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
