import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/product.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/', checkPermission('product.read'), listProducts);
router.post('/', checkPermission('product.create'), createProduct);
router.get('/:productId', checkPermission('product.read'), getProduct);
router.patch('/:productId', checkPermission('product.update'), updateProduct);
router.delete('/:productId', checkPermission('product.delete'), deleteProduct);

export default router;
