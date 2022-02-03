const userModel = require('../models/userModel');
const validate = require('../validators/validator');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const saltRounds = 10;
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


        s3.upload(uploadParams, function (error, data) {
            if (error) {
                return reject({ "error": error });
            }
            return resolve(data.Location);
        });
    });
};



//Create User
const userRegister = async (req, res) => {
    try {
        const Body = req.body
        const { fname, lname, email, phone, password, address } = Body;
        let files = req.files


        if (!validate.isValidRequestBody(Body)) {
            return res.status(400).send({ status: false, message: "Please provide The Data" });
        }
        if (!validate.isValid(fname)) {
            return res.status(400).send({ status: false, message: "Please provide fname" });
        }
        if (!validate.isValid(lname)) {
            return res.status(400).send({ status: false, message: "Please provide lname" });
        }

        if (!validate.isValid(email)) {
            return res.status(400).send({ status: false, message: "Please provide Email id" });;
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `${email} should be a valid email address` })
            return
        }
        const AlreadyUsedEmail = await userModel.findOne({ email });
        if (AlreadyUsedEmail) {
            return res.status(400).send({ status: false, message: "This email Id already in Used" });
        }

        if (!validate.isValid(phone)) {
            return res.status(400).send({ status: false, message: "Please provide phone number" });
        }
        if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone.trim())) {
            return res.status(400).send({ status: false, message: `Phone number should be a  valid indian number` });
        }
        const AlreadyUsedPhone = await userModel.findOne({ phone })
        if (AlreadyUsedPhone) {
            return res.status(400).send({ status: false, message: "This phone number already In Used" });
        }
        if (!validate.isValid(password)) {
            return res.status(400).send({ status: false, message: "Please provide password or password field" });
        }
        if (!(/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password))) {
            res.status(400).send({ status: false, message: `Password length should be A Valid Password And Length Should Be in between 8 to 15 ` });
            return;
        }
        if (!validate.isValid(address)) {
            return res.status(400).send({ status: false, message: "Please provide address Details" });
        }
        if (address) {
            if (!validate.isValid(address.shipping.street)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping street" });
            }
            if (!validate.isValid(address.shipping.city)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping city" });
            }
            if (!validate.isValid(address.shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Please provide address shipping pincode" });
            }
            if (!validate.isValid(address.billing.street)) {
                return res.status(400).send({ status: false, message: "Please provide address billing street" });
            }
            if (!validate.isValid(address.billing.city)) {
                return res.status(400).send({ status: false, message: "Please provide address billing city" });
            }
            if (!validate.isValid(address.billing.pincode)) {
                return res.status(400).send({ status: false, message: "Please provide address billing pincode" });
            }
        }

        if (!files || (files && files.length === 0)) {
            return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });
        }


        const profilePic = await uploadFile(files[0])
        const hash = bcrypt.hashSync(password, saltRounds);
        let userregister = { fname, lname, email, profileImage: profilePic, phone, password: hash, address }
        const userData = await userModel.create(userregister);
        return res.status(201).send({ status: true, message: 'Success', data: userData });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//Login
const userLogin = async (req, res) => {
    try {
        const body = req.body
        const { email, password } = body
        if (!validate.isValidRequestBody(body)) {
            return res.status(400).send({ status: false, message: "Please provide The Credential To Login" });
        }
        if (!validate.isValid(email)) {
            return res.status(400).send({ status: false, message: "Please provide The Email-id" });
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `${email} should be a valid email address` })
            return
        }

        if (!validate.isValid(password)) {
            return res.status(400).send({ status: false, message: "Please provide The password" });;
        }
        if (!(/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password))) {
            res.status(400).send({ status: false, message: `Password length should be A Valid Password And Length Should Be in between 8 to 15 ` });
            return;
        }
        let user = await userModel.findOne({ email: email });
        if (user) {
            const Passwordmatch = await bcrypt.compareSync(body.password, user.password);
            if (Passwordmatch) {
                const generatedToken = jwt.sign({
                    userId: user._id,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 60 * 180
                }, 'group16')

                return res.status(200).send({
                    "status": true,
                    Message: " user loggedIn Succesfully",
                    data: {
                        userId: user._id,
                        token: generatedToken,
                    }
                });
            } else {
                res.status(401).send({ error: "Password Is Wrong" });
            }
        } else {
            return res.status(400).send({ status: false, message: "Invalid credentials" });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};



const getUser = async (req, res) => {
    try {
        let userId = req.params.userId
        let tokenId = req.userId

        if (!(validate.isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId is Invalid" });;
        }
        if (!(validate.isValid(userId))) {
            return res.status(400).send({ status: false, message: "Provide The UserId" });;
        }
        if (!(validate.isValidObjectId(tokenId))) {
            return res.status(400).send({ status: false, message: "Tokenid is Invalid" });;
        }
        if (!(validate.isValid(tokenId))) {
            return res.status(400).send({ status: false, message: "Provide The TokenId" });;
        }

        let checkData = await userModel.findOne({ _id: userId });
        if (!checkData) {
            return res.status(404).send({ status: false, msg: "There is no user exist with this id" });
        }
        if (!(userId == tokenId)) {
            return res.status(401).send({ status: false, message: `You Are Not Authorized To Perform The Task` });
        }
        return res.status(200).send({ status: true, message: 'Success', data: checkData });
    }
    catch (error) {
        console.log(err)
        return res.status(500).send({ status: false, msg: error.message });
    }
}


//Update User
const updateUser = async (req, res) => {
    try {
        let userId = req.params.userId;
        let tokenId = req.userId
        if (!(validate.isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId is Invalid" });;
        }
        if (!(validate.isValid(userId))) {
            return res.status(400).send({ status: false, message: "Provide The UserId" });;
        }
        if (!(validate.isValidObjectId(tokenId))) {
            return res.status(400).send({ status: false, message: "Tokenid is Invalid" });;
        }
        if (!(validate.isValid(tokenId))) {
            return res.status(400).send({ status: false, message: "Provide The TokenId" });;
        }


        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: "User does not exist with this userid" })
        }
        if (!(userId == tokenId)) {
            return res.status(401).send({ status: false, message: `You Are Not Authorized To Perform This Task` });
        }
        let Body = req.body
        if (!validate.isValidRequestBody(Body)) {
            return res.status(400).send({ status: false, message: "Please provide Details To Be Uploaded Please" });
        }
        const { fname, lname, email, profileImage, phone, password, address } =Body

        if (fname || lname || email || phone || password || address || profileImage) {
            
            if (!validate.isValid(fname)) {
                return res.status(400).send({ status: false, message: "Please Provide The First Name" })
            }
            if (!validate.isValid(lname)) {
                return res.status(400).send({ status: false, message: "Please Provide The Last Name" })
            }
            if (!validate.isValid(email)) {
                return res.status(400).send({ status: false, message: "Please Provide The Email Adress" })
            }
            if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
                res.status(400).send({ status: false, message: `${email} should be a valid email address` })
                return
            }

            if (!validate.isValid(phone)) {
                return res.status(400).send({ status: false, message: "Please Provide The Phone Number" })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone.trim())) {
                return res.status(400).send({ status: false, message: `Phone number should be a  valid indian number` });
            }

            if (!validate.isValid(password)) {
                return res.status(400).send({ status: false, message: "Please Provide The Password" })
            }
            if (!(/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password))) {
                res.status(400).send({ status: false, message: `Password length should be A Valid Password And Length Should Be in between 8 to 15 ` });
                return;
            }

            if (!validate.isValid(profileImage)) {
                return res.status(400).send({ status: false, message: "profileImage is missing" })
            }
        }
        const AlreadyUsedPhoneNum = await userModel.findOne({ phone })
        if (AlreadyUsedPhoneNum) {
            return res.status(400).send({ status: false, message: "This phone number already In Used" });
        }
        const AlreadyUsedEmailId = await userModel.findOne({ email });
        if (AlreadyUsedEmailId) {
            return res.status(400).send({ status: false, message: "This email Id already in Used" });
        }
        
        if (password) {
             updatePassword = await bcrypt.hash(password, saltRounds)
        }

        let files = req.files;
        if ((files && files.length > 0)) {
            const profileImage = await uploadFile(files[0])
            let updateProfile = await userModel.findOneAndUpdate({ _id: userId }, { fname: fname, lname: lname, email: email, password: updatePassword, profileImage: profileImage, address: address, phone }, { new: true });
            res.status(200).send({ status: true, message: "Your Profile Is Updated", data: updateProfile, });
        } else {
            let updateProfile = await userModel.findOneAndUpdate({ _id: userId }, { fname: fname, lname: lname, email: email, password: updatePassword, address: address, phone }, { new: true });
            res.status(200).send({ status: true, message: "Your Profile Is Updated", data: updateProfile, });
        }
    } catch (error) {
        return res.status(500).send({status:false, message: error.message });
    };
}

module.exports = {userRegister,userLogin,getUser,updateUser}






