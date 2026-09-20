
// import { Router } from 'express';
// import { addItem, getItems, updateItem, deleteItem } from '../controllers/itemController.js';
// import { requireAuth } from '../middleware/authMiddleware.js';

// const router = Router();

// // Legacy-style endpoints (if anything still uses /add, /get, etc.)
// router.post('/add', requireAuth, addItem);
// router.get('/get', requireAuth, getItems);
// router.put('/update/:id', requireAuth, updateItem);
// router.delete('/delete/:id', requireAuth, deleteItem);

// // RESTful aliases used by your current UI
// router.post('/', requireAuth, addItem);
// router.get('/', requireAuth, getItems);
// router.put('/:id', requireAuth, updateItem);
// router.delete('/:id', requireAuth, deleteItem);

// export default router;

// routes/itemRoutes.js
// routes/itemRoutes.js
import { Router } from 'express';
import { addItem, getItems, updateItem, deleteItem } from '../controllers/itemController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/* Legacy-style endpoints (keep for backwards compatibility) */
router.post('/add', requireAuth, addItem);
router.get('/get', requireAuth, getItems);
router.put('/update/:id', requireAuth, updateItem);
router.delete('/delete/:id', requireAuth, deleteItem);

/* RESTful aliases (used by modern clients) */
router.post('/', requireAuth, addItem);
router.get('/', requireAuth, getItems);
router.put('/:id', requireAuth, updateItem);
router.delete('/:id', requireAuth, deleteItem);

export default router;
