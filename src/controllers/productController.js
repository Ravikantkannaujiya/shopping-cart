const productModel = require('../models/productModel');
const validate = require('../validators/validator');
const aws = require("aws-sdk");

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",
    secretAccessKey: "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",
    region: "ap-south-1"
});
let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {


        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "Gr16/" + file.originalname,
            Body: file.buffer,
        };
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            return resolve(data.Location);
        });
    });
};

//Create Product
const createProduct = async (req, res) => {
    try {
        const Body = req.body
        if (!validate.isValidRequestBody(Body)) {
            return res.status(400).send({ status: false, message: "Please provide The Data" });
        }
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = Body
        let files = req.files

        if (!validate.isValid(title)) {
            return res.status(400).send({ status: false, message: "Please provide title" });
        }
        const TitleAlreadyInUsed = await productModel.findOne({ title });
        if (TitleAlreadyInUsed) {
            return res.status(400).send({ status: false, message: "This title is already in Used" });
        }
        if (!validate.isValid(description)) {
            return res.status(400).send({ status: false, message: "Please provide description" });
        }
        if (!validate.isValid(price)) {
            return res.status(400).send({ status: false, message: "Please provide The Price Of The Product" });;
        }
        if (price <= 0) {
            return res.status(400).send({ status: false, message: "Price Cant Be In Negetive" });;
        }

        if (!validate.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "Please provide currencyId" });;
        }
        if (!(Body.currencyId == "INR")) {
            return res.status(400).send({ status: false, message: "Please provide currencyId in INR only" });;
        }
        if (!validate.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Please provide currencyFormat" });;
        }
        if (!(Body.currencyFormat == "₹")) {
            return res.status(400).send({ status: false, message: "Please provide currencyFormat in format ₹ only" });;
        }
        if (!files || (files && files.length === 0)) {
            return res.status(400).send({ status: false, message: "Please Provide The Product Image" });
        }
        if (!validate.isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please provide available Sizes field" });;
        }
        const Picture = await uploadFile(files[0])
        let product = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage: Picture, style, availableSizes, installments }
        if (availableSizes) {
            let array = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(',')}` })
                }
            }
            if (Array.isArray(array)) {
                console.log(Array.isArray(array))
                productRegister['availableSizes'] = array
            }
        }
        const data = await productModel.create(product);
        return res.status(201).send({ status: true, message: 'Success', data: data });
    }
    catch (error) {
        console.log(err)
        return res.status(500).send({ status: false, message: error.message });
    }
}




//Get Product
const getproduct = async (req, res) => {
    try {
        let filterQuery = req.query;
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = filterQuery;
        if (size || name || priceGreaterThan || priceLessThan || priceSort) {
            let query = { isDeleted: false }

            if (size) {
                query['availableSizes'] = size
            }
            if (name) {
                query['title'] = { $regex: name }
            }
            if (priceGreaterThan) {
                query['price'] = { $gt: priceGreaterThan }
            }
            if (priceLessThan) {
                query['price'] = { $lt: priceLessThan }
            }
            if (priceGreaterThan && priceLessThan) {
                query['price'] = { '$gt': priceGreaterThan, '$lt': priceLessThan }
            }
            if (priceSort) {
                if (!(priceSort == -1 || priceSort == 1)) {
                    return res.status(400).send({ status: false, message: "You Can Only Use 1 For Ascending And -1 For Descending Sorting" })
                }
            }

            let getAllProduct = await productModel.find(query).sort({ price: priceSort })
            const found = getAllProduct.length
            if (!(found > 0)) {
                return res.status(404).send({ status: false, msg: "Currently Their Are No Product" })
            }
            return res.status(200).send({ status: true, message: `Success`, data: getAllProduct });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })

    }
}


//Get Product By Id
const getProductsById = async (req, res) => {
    try {
        let productId = req.params.productId
        if (!validate.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please Provide a valid productId" });;
        }
        let Product = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!Product) {
            return res.status(404).send({ status: false, msg: "No Product Found" });
        }
        return res.status(200).send({ status: true, message: 'Success', data: Product });
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}

//Update Product
const updateProduct = async (req, res) => {
    try {
        let Body = req.body
        const productId = req.params.productId


        if (!validate.isValidRequestBody(Body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide  details to update' })
            return
        }

        if (!validate.isValidObjectId(productId)) {
            return res.status(404).send({ status: false, message: "productId is  Invalid" })
        }

        const Findproduct = await productModel.findOne({ _id: productId, isDeleted: false, })


        if (!Findproduct) {
            res.status(404).send({ status: false, message: "product Not Found" })
            return
        }
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = Body
        if (title || description || price || currencyId || currencyFormat || isFreeShipping || productImage || style || availableSizes || installments) {
            if (!validate.isValid(title))
                return res.status(400).send({ status: false, message: "Please Provide A valid Title" })

            const Title = await productModel.findOne({ title: title });
            if (Title) {
                res.status(400).send({ status: false, message: `${title} Is Already In Used`, });
                return;
            }
            if (!validate.isValid(description)) {
                return res.status(400).send({ status: false, message: "Please provide the description" })
            }

            if (!validate.validString(price)) {
                return res.status(400).send({ status: false, message: "Please provide the price" })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: "Please provide A Valid Price" })
            }

            if (!validate.isValid(currencyId)) {
                return res.status(400).send({ status: false, message: "Please provide the currrency Id" })

            } if (currencyId) {
                if (currencyId !== 'INR') {
                    res.status(400).send({ status: false, message: 'Please provide currencyId in INR only' })
                    return
                }
            }

            if (!validate.isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: "Please provide the currencyformat" })
            } if (currencyFormat) {
                if (currencyFormat !== '₹') {
                    res.status(400).send({ status: false, message: 'Please provide currencyFormat in format ₹ only' })
                    return
                }
            }
            if (!validate.isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "Please provide isFreeShipping" })
            }
            if (isFreeShipping) {
                if (!(isFreeShipping == 'false' || isFreeShipping == 'true')) {
                    res.status(400).send({ status: false, message: 'Please provide valid isFreeShipping in boolean Form Only' })
                    return
                }
            }

            if (!validate.isValid(style)) {
                return res.status(400).send({ status: false, message: "Please provide the style" })
            }
            if (!validate.isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: "Please provide the available sizes" })
            }
            if (availableSizes) {
                let array = availableSizes.split(",").map(x => x.trim())
                console.log(array)
                for (let i = 0; i < array.length; i++) {
                    if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                        return res.status(400).send({ status: false, msg: `Available sizes should be from these${["S", "XS", "M", "X", "L", "XXL", "XL"].join(',')}` })
                    }
                }

            }
            if (!validate.isValid(installments)) {
                return res.status(400).send({ status: false, message: "Please provide installment" })
            }
            let files = req.files;
            if ((files && files.length > 0)) {
                const productImage = await uploadFile(files[0])
                let updateProduct = await productModel.findOneAndUpdate({ _id: productId }, { title: title, description: description, price: price, currencyId: currencyId, currencyFormat: currencyFormat, productImage: productImage, style: style, availableSizes: availableSizes, installments: installments, isFreeShipping: isFreeShipping }, { new: true });
                res.status(200).send({ status: true, message: "Successfully Updated", data: updateProduct });
            } else {
                let updateProduct = await productModel.findOneAndUpdate({ _id: productId }, { title: title, description: description, price: price, currencyId: currencyId, currencyFormat: currencyFormat, style: style, availableSizes: availableSizes, installments: installments, isFreeShipping: isFreeShipping }, { new: true });
                res.status(200).send({ status: true, message: "Successfully Updated", data: updateProduct });
            }
        }


    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}







const deleteProduct = async (req, res) => {
    try {
        let ProductId = req.params.productId;
        if (!validate.isValidObjectId(ProductId)) {
            return res.status(400).send({ status: false, message: "productId is  Invalid" })
        }
        let data = await productModel.findOne({ _id: params, isDeleted: false });
        if (!data) {
            return res.status(404).send({ status: false, message: "This Product Data is already deleted Or Doesn't Exist" });
        }
        let deleteproduct = await productModel.findOneAndUpdate({ _id: params }, { isDeleted: true, deletedAt: Date() }, { new: true });
        return res.status(200).send({ status: true, message: 'Success', data: deleteproduct });

    } catch (err) {
        return res.status(500).send({ message: err.message });
    }
};
module.exports = { createProduct, getproduct, getProductsById, updateProduct, deleteProduct }


