import { Router } from 'express';
import {
    listCustomers,
    getCustomer,
    createCustomerHandler,
    updateCustomerHandler,
    deleteCustomerHandler,
    getCustomerHistory,
} from '../controllers/customer.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/', checkPermission('customer.read'), listCustomers);
router.post('/', checkPermission('customer.create'), createCustomerHandler);
router.get('/:customerId', checkPermission('customer.read'), getCustomer);
router.put('/:customerId', checkPermission('customer.update'), updateCustomerHandler);
router.delete('/:customerId', checkPermission('customer.delete'), deleteCustomerHandler);
router.get('/:customerId/history', checkPermission('customer.read'), getCustomerHistory);

export default router;
