const mongoose = require("mongoose");


const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel',
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,//json object
            ref: 'productModel',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        }
      
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    totalItems: {
        type: Number,
        required: true,
    },
}, { timestamps: true })

module.exports = mongoose.model('cartModel', cartSchema)