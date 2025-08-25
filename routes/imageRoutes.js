import express from 'express';
import { generateImage, saveImage, getUserImages } from '../controllers/imageController.js';
import userAuth from '../Middlewares/auth.js';

const imageRouter = express.Router();

imageRouter.post('/generate-image', userAuth, generateImage);
imageRouter.post('/save', userAuth, saveImage);
imageRouter.get('/my-images', userAuth, getUserImages);

export default imageRouter;