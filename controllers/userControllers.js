import UserModel from "../models/userModels.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import razorpay from "razorpay";
import transcationModel from "../models/transcationModel.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new UserModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token, user: { name: user.name } });


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });

    }
}



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User Not Exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        return res.json({ success: true, token, user: { name: user.name } });

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};


const userCredits = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await UserModel.findById(userId);
        res.json({ success: true, credits: user.creditBalance, user: { name: user.name } });

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
}


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const paymentRazorpay = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;

        const userData = await UserModel.findById(userId);

        if (!userId || !planId) {
            return res.json({ success: false, message: "Missing Details" });
        }

        let credits, plan, amount, date;

        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 100;
                amount = 10;
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 500;
                amount = 50;
                break;

            case 'Business':
                plan = 'Business'
                credits = 5000;
                amount = 250;
                break;

            default:
                return res.json({ success: false, message: "Plan not found" });
        }

        date = Date.now();

        const transitionData = {
            userId, plan, amount, credits, date
        }

        const newTranscation = await transcationModel.create(transitionData)

        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTranscation._id
        }

        await razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error.message });
            }
            return res.json({ success: true, order });
        })

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
}


const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            const transcationData = await transcationModel.findById(orderInfo.receipt);
            if (transcationData.payment) {
                return res.json({ success: false, message: "Payment Failed" });
            }

            const userData = await UserModel.findById(transcationData.userId);

            const creditBalance = userData.creditBalance + transcationData.credits;
            await UserModel.findByIdAndUpdate(userData._id, { creditBalance });

            await transcationModel.findByIdAndUpdate(transcationData._id, { payments: true });

            res.json({ success: true, message: "Credits Added" });
        } else {
            res.json({ success: false, message: "Payment Failed" });
        }


    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
}




export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay };