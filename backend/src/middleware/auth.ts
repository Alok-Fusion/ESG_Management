import { Request, Response, NextFunction } from 'express';
import { getSession, JWTPayload } from '../lib/auth';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = session;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (session.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Admin role required.' });
  }
  req.user = session;
  next();
}

export function requireManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (session.role !== 'Admin' && session.role !== 'Manager') {
    return res.status(403).json({ error: 'Forbidden. Manager or Admin role required.' });
  }
  req.user = session;
  next();
}
