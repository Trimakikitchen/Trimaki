import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate, isAdmin, isKitchen } from '../middleware/auth';

// Controllers and schemas
import { authController, authSchemas } from '../controllers/auth';
import { productsController, productSchemas } from '../controllers/products';
import { inventoryController, inventorySchemas } from '../controllers/inventory';
import { ordersController, orderSchemas } from '../controllers/orders';
import { customersController, customerSchemas } from '../controllers/customers';
import { analyticsController } from '../controllers/analytics';
import { chatController, chatSchemas } from '../controllers/chat';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================
router.post('/auth/register', validate({ body: authSchemas.register }), authController.register);
router.post('/auth/login', validate({ body: authSchemas.login }), authController.login);
router.post('/auth/google', authController.googleSignIn);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/forgot-password', validate({ body: authSchemas.forgotPassword }), authController.forgotPassword);
router.post('/auth/reset-password', validate({ body: authSchemas.resetPassword }), authController.resetPassword);

router.get('/users/profile', authenticate, authController.getProfile);
router.put('/users/profile', authenticate, validate({ body: authSchemas.updateProfile }), authController.updateProfile);

// ==========================================
// 2. PRODUCTS & CATEGORIES
// ==========================================
router.get('/categories', productsController.getAllCategories);
router.post('/categories', authenticate, isAdmin, validate({ body: productSchemas.createCategory }), productsController.createCategory);
router.put('/categories/:id', authenticate, isAdmin, validate({ body: productSchemas.createCategory }), productsController.updateCategory);
router.delete('/categories/:id', authenticate, isAdmin, productsController.deleteCategory);

router.get('/products', productsController.getAllProducts);
router.get('/products/:slug', productsController.getProductBySlug);
router.post('/products', authenticate, isAdmin, validate({ body: productSchemas.createProduct }), productsController.createProduct);
router.put('/products/:id', authenticate, isAdmin, productsController.updateProduct);
router.delete('/products/:id', authenticate, isAdmin, productsController.deleteProduct);

// ==========================================
// 3. INVENTORY & RECIPES
// ==========================================
router.get('/inventory', authenticate, isKitchen, inventoryController.getAllIngredients);
router.post('/inventory', authenticate, isAdmin, validate({ body: inventorySchemas.createIngredient }), inventoryController.createIngredient);
router.post('/inventory/:id/adjust', authenticate, isAdmin, validate({ body: inventorySchemas.adjustStock }), inventoryController.adjustStock);
router.get('/inventory/logs', authenticate, isAdmin, inventoryController.getInventoryLogs);

router.get('/products/:productId/recipe', authenticate, isKitchen, inventoryController.getProductRecipe);
router.post('/products/:productId/recipe', authenticate, isAdmin, validate({ body: inventorySchemas.createRecipe }), inventoryController.addRecipeItem);
router.delete('/products/:productId/recipe/:recipeItemId', authenticate, isAdmin, inventoryController.deleteRecipeItem);

// ==========================================
// 4. ORDERS & PAYMENTS
// ==========================================
router.post('/orders', authenticate, validate({ body: orderSchemas.createOrder }), ordersController.createOrder);
router.get('/orders', authenticate, ordersController.getAllOrders);
router.get('/orders/:id', authenticate, ordersController.getOrderById);
router.post('/orders/:id/status', authenticate, isKitchen, validate({ body: orderSchemas.updateStatus }), ordersController.updateStatus);
router.post('/orders/:id/verify-otp', validate({ body: orderSchemas.verifyOTP }), ordersController.verifyOTP);

router.post('/payments/verify', validate({ body: orderSchemas.verifyPayment }), ordersController.verifyPayment);

// ==========================================
// 5. CUSTOMER ADD-ONS & LOGISTICS
// ==========================================
router.get('/addresses', authenticate, customersController.getAddresses);
router.post('/addresses', authenticate, validate({ body: customerSchemas.createAddress }), customersController.createAddress);
router.delete('/addresses/:id', authenticate, customersController.deleteAddress);

router.post('/reviews', authenticate, validate({ body: customerSchemas.createReview }), customersController.createReview);
router.get('/products/:productId/reviews', customersController.getProductReviews);

router.get('/wishlist', authenticate, customersController.getWishlist);
router.post('/wishlist', authenticate, customersController.addToWishlist);
router.delete('/wishlist/:id', authenticate, customersController.removeFromWishlist);

router.get('/notifications', authenticate, customersController.getNotifications);
router.post('/notifications/:id/read', authenticate, customersController.markAsRead);

router.get('/coupons', authenticate, customersController.getAllCoupons);
router.post('/coupons', authenticate, isAdmin, validate({ body: customerSchemas.createCoupon }), customersController.createCoupon);

router.get('/offers', customersController.getAllOffers);
router.post('/offers', authenticate, isAdmin, validate({ body: customerSchemas.createOffer }), customersController.createOffer);

// ==========================================
// 6. BUSINESS ANALYTICS
// ==========================================
router.get('/analytics/dashboard', authenticate, isAdmin, analyticsController.getDashboardStats);

// ==========================================
// 7. CHAT SUPPORT
// ==========================================
router.get('/chat/conversations', authenticate, isAdmin, chatController.getConversations);
router.get('/chat/messages', authenticate, chatController.getConversation);
router.post('/chat/messages', authenticate, validate({ body: chatSchemas.sendMessage }), chatController.sendMessage);

export default router;
