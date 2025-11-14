import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getWidgetsForUser } from '../services/access-control.service';

export const getAccessibleWidgets = asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const widgets = await getWidgetsForUser(req.user.id);
  res.json(widgets);
});
