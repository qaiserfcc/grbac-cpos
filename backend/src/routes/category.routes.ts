import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/category.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/', checkPermission('category.read'), listCategories);
router.post('/', checkPermission('category.create'), createCategory);
router.patch('/:categoryId', checkPermission('category.update'), updateCategory);
router.delete('/:categoryId', checkPermission('category.delete'), deleteCategory);

export default router;
