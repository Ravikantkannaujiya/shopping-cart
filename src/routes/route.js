const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const Middleware = require('../middlewares/authMiddleware')


//User
router.post('/registeruser', userController.userRegister)
router.post('/userlogin', userController.userLogin)
router.get('/user/:userId/profile',Middleware.Authentication,userController.getUser)
router.put('/user/:userId/profile',Middleware.Authentication,userController.updateUser)

//Product
router.post('/products',productController.createProduct)
router.get('/products',productController.getproduct)
router.get('/products/:productId',productController.getProductsById)
router.put('/products/:productId',productController.updateProduct)
router.delete('/products/:productId',productController.deleteProduct)

//Cart
router.post('/users/:userId',Middleware.Authentication,cartController.createCart)
router.get('/users/:userId/cart',Middleware.Authentication,cartController.getCart)
router.put('/users/:userId/cart',Middleware.Authentication,cartController.updateCart)
router.delete('/users/:userId/cart',Middleware.Authentication,cartController.deleteCart)

//Order
router.post('/users/:userId/orders',Middleware.Authentication,orderController.createOrder)
router.put('/users/:userId/orders',Middleware.Authentication,orderController.updateOrder)




//---------------------------GENERATE S3 URL----------------------------//
//router.post('/write-file-aws',awsController.userAws)

module.exports = router;