import { Router } from 'express';
import authRoutes from './auth.routes';
import rbacRoutes from './rbac.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import dashboardRoutes from './dashboard.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rbac', rbacRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);

export default router;
