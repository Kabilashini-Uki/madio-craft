import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkProducts = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handmade';
        await mongoose.connect(mongoURI);
        console.log('Connected to DB:', mongoURI);

        const Product = mongoose.model('Product', new mongoose.Schema({ artisan: mongoose.Schema.Types.ObjectId }));
        const User = mongoose.model('User', new mongoose.Schema({ role: String }));
        const Artisan = mongoose.model('Artisan', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId }));

        const products = await Product.find({}).limit(20);
        console.log(`Found ${products.length} products total`);

        for (const p of products) {
            const user = await User.findById(p.artisan);
            const artisan = await Artisan.findById(p.artisan);
            console.log(`Product ${p._id}: artisan=${p.artisan} -> User? ${!!user} (role=${user?.role}), Artisan? ${!!artisan}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic error:', err);
        process.exit(1);
    }
};

checkProducts();
