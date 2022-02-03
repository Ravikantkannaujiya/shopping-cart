const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const validate = require('../validators/validator');

//Cart Creation
const createCart = async (req, res)=> {
    try {
        const userId = req.params.userId
        let tokenId = req.userId
        const productId = req.body.items[0].productId
        if (!(validate.isValidObjectId(userId))){
            return res.status(400).send({ status: false, message: "userId is not a valid Id" });;
        }
        if (!(validate.isValidObjectId(tokenId))) {
            return res.status(400).send({ status: false, message: "Token Id is not a valid Id" });;
        }
        if (!(userId == tokenId)) {
            return res.status(401).send({ status: false, message:"You Are Not Authorized To Perform This Task" });
        }
        if (!validate.isValidObjectId(productId)) {
            return res.status(404).send({ status: false, message: "productId is not valid" })
        }

        const Body = req.body
        if (!validate.isValidRequestBody(Body)) {
            return res.status(400).send({ status: false, message: "Please provide Data" });
        }
        let { items } = Body
        const user = await userModel.findById(userId)
        if (!user) {
            res.status(400).send({ status: false, msg: "user not found" })
        }
        const cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            const TotalItem = items.length
            const product = await productModel.findOne({ _id: items[0].productId, isDeleted: false })

            if (!product) {
                return res.status(404).send({ status: false, message: "product don't exist or it's deleted" })
            }
            const TotalPrice = product.price * items[0].quantity
    
            const cartData = { items: items, totalPrice: TotalPrice, totalItems: TotalItem, userId: userId }
            
            const createCart = await cartModel.create(cartData)
            
            return res.status(201).send({ status: true, message: `cart created successfully`, data: createCart })
        }
        else {
            
            const product = await productModel.findOne({ _id: items[0].productId }, { isDeleted: false })
            if (!product) {
                return res.status(404).send({ status: false, message: "Product Not Found" })
            }
            
            const Amount = cart.totalPrice + (product.price * items[0].quantity)
            
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == items[0].productId) {
                    cart.items[i].quantity = cart.items[i].quantity + items[0].quantity
                    const changecart = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice:Amount }, { new: true })
                    return res.status(201).send({ status: true, message: `product added In Your Cart Successfully`, data:changecart })
                }
            }
            const totalItem = items.length + cart.TotalItem

            const cartData = await cartModel.findOneAndUpdate({ userId: userId }, { $addToSet: { items: { $each: items } }, totalPrice:Amount, totalItems: totalItem }, { new: true })
            return res.status(201).send({ status: true, message: `product added in Your Cart Successfully`, data: cartData })

        }
    } catch (error) {
        
        return res.status(500).send({ status: false, msg: error.message });
    }
}

//Get Cart
const getCart = async (req, res) => {
    try {
        const userId = req.params.userId
        let tokenId = req.userId

        if (!(validate.isValidObjectId(tokenId))) {
            return res.status(400).send({ status: false, message: "Token Id Is Invalid" });;
        }
        if (!(validate.isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId or token is not valid" });;
        }
        if (!(userId == tokenId)) {
            return res.status(401).send({ status: false, message: "You Are Not Authorized To Perform This Task" });
        }
        const checkUser = await cartModel.findOne({ userId: userId })
        if (!checkUser) {
            return res.status(404).send({ status: false, msg: "There is no cart exist with this user id" });
        }

        return res.status(200).send({ status: true, message: 'User cart details', data: checkUser });
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }
}

//Cart Updation
const updateCart = async (req, res) => {
    try {
        const userId = req.params.userId
        const tokenId = req.userId

        if (!validate.isValidObjectId(tokenId)) {
            return res.status(400).send({ status: false, message:  "Invalid Token Id" })
        }
        if (!validate.isValidObjectId(userId)) {
           return  res.status(400).send({ status: false, msg: "Invalid user id" })
        }
        const user = await userModel.findById({ _id: userId })
        if (!user) {
           return  res.status(400).send({ status: false, msg: "user not found" })
        }
        if (userId!==tokenId) {
            res.status(401).send({ status: false, message:"You Are Not Authorized To Perform This Task" });
            return
        }
        const Body = req.body
        let { productId, removeProduct, cartId } = Body
        const findCart = await cartModel.findOne({ _id: cartId })
        if (!findCart) {
            return res.status(400).send({ status: false, message: `cart does not exist` })
        }

        const product = await productModel.findOne({ _id:productId, isDeleted: false })

        if (removeProduct == 1) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (findCart.items[i].productId == productId) {
                    const updatedPrice = findCart.totalPrice - product.price
                    findCart.items[i].quantity = findCart.items[i].quantity - 1
                    if (findCart.items[i].quantity > 0) {
                        const Data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: updatedPrice }, { new: true })
                        return res.status(200).send({ status: true, message:"Item Removed", data: Data })
                    }
                    else {
                        const totalItems1 = findCart.totalItems - 1
                        findCart.items.splice(i, 1)

                        const data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalItems: totalItems1, totalPrice: updatedPrice }, { new: true })
                        return res.status(200).send({ status: true, message: "Product Removed", data:data })

                    }
                }

            }
        }
        if (removeProduct == 0) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (findCart.items[i].productId == productId) {
                    const updatedPrice = findCart.totalPrice - (product.price * findCart.items[i].quantity)
                    const TotalItems = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                    const result = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalItems: TotalItems, totalPrice: updatedPrice }, { new: true })
                    return res.status(200).send({ status: true, message:"Product Was Removed From The Cart", data: result })

                }
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}




//Delete Cart
const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId
        let tokenId = req.userId
        if (!(validateBody.isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId is not valid" });;
        }
        if (!(validateBody.isValidObjectId(tokenId))) {
            return res.status(400).send({ status: false, message: "Token is not valid" });;
        }
        if (!(userId == tokenId)) {
            return res.status(401).send({ status: false, message: "You Are Not Authorized To Perform This Task" });
        }
        const checkCart = await cartModel.findOne({ userId: userId })
        if (!checkCart) {
            return res.status(404).send({ status: false, msg: "Cart doesn't exist" })
        }
        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, msg: "user doesn't exist" })
        }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })
        res.status(200).send({ status: true, msg: "Successfully deleted", data: deleteCart })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message });
    }


}





module.exports = {createCart,getCart,deleteCart,updateCart}
