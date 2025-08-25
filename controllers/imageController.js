import axios from "axios";
import UserModel from "../models/userModels.js";
import FormData from 'form-data';
import ImageModel from "../models/Image.js";

// export const generateImage = async (req, res) => {
//     try {

//         const { prompt } = req.body;
//         const userId = req.user.id;

//         const user = await UserModel.findById(userId);

//         if (!user || !prompt) {
//             return res.json({ success: false, message: "Missing Details" });
//         }

//         if (user.creditBalance === 0 || user.creditBalance < 0) {
//             return res.json({ success: false, message: "No Credit Balance", creditBalance: user.creditBalance });
//         }


//         const formData = new FormData();
//         formData.append('prompt', prompt);

//         const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
//             headers: {
//                 'x-api-key': process.env.CLIPDROP_API,
//             },
//             responseType: 'arraybuffer',
//         })

//         const base64Image = Buffer.from(data, 'binary').toString('base64');
//         const resultImage = `data:image/png;base64,${base64Image}`;

//         await UserModel.findByIdAndUpdate(user._id, {
//             creditBalance: user.creditBalance - 1
//         });

//         res.json({ success: true, message: "Image Generated", creditBalance: user.creditBalance - 1, resultImage });


//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: error.message });
//     }
// }


export const generateImage = async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.user.id;

        const user = await UserModel.findById(userId);

        if (!user || !prompt) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (user.creditBalance <= 0) {
            return res.json({ success: false, message: "No Credit Balance", creditBalance: user.creditBalance });
        }

        const formData = new FormData();
        formData.append('prompt', prompt);

        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: {
                'x-api-key': process.env.CLIPDROP_API,
            },
            responseType: 'arraybuffer',
        });

        const base64Image = Buffer.from(data, 'binary').toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;
        console.log("Generated Image URL:", resultImage);

        // Deduct credit
        await UserModel.findByIdAndUpdate(user._id, {
            creditBalance: user.creditBalance - 1
        });

        // ✅ Save the generated image into MongoDB
        const newImage = new Image({
            userId: user._id,
            url: resultImage,
            prompt,
        });
        await newImage.save();

        res.json({
            success: true,
            message: "Image Generated & Saved",
            creditBalance: user.creditBalance - 1,
            image: newImage
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};



export const saveImage = async (req, res) => {
    try {
        const { url, prompt } = req.body;
        const newImage = new ImageModel({
            userId: req.user.id,
            url,
            prompt,
        });
        await newImage.save();
        res.json({ success: true, image: newImage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get images for logged-in user
export const getUserImages = async (req, res) => {
    try {
        const images = await ImageModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(images);
    } catch (error) {
        console.error("Error in getMyImages:", error.message);
        res.status(500).json({ message: error.message });
    }
};