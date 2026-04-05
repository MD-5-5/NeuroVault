import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import supabase from './config/supabase.js'
import contentRoutes from './routes/content.js'
import searchRoutes from './routes/search.js'
import './workers/contentWorker.js'
dotenv.config()

const app = express()

app.use(cors({ origin: [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  "https://intelli-seek-pro.vercel.app",
  "https://neuro-vault-swart.vercel.app",
  /^chrome-extension:\/\// // Allow all Chrome extensions for now as requested
]}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure Supabase Vault Images Bucket exists
const initBucket = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'vault-images')) {
      await supabase.storage.createBucket('vault-images', { public: true });
      console.log('✅ Supabase "vault-images" bucket verified.');
    }
  } catch (error) {
    console.error('Failed to init supabase bucket:', error);
  }
};
initBucket();

app.use('/api/content', contentRoutes)
app.use('/api/search', searchRoutes)

app.get('/health', (req, res) => res.json({ status: 'NeuroVault backend running ✅' }))

app.listen(process.env.PORT || 5000, () => {
  console.log(`🧠 NeuroVault backend running on port ${process.env.PORT}`)
})

app.get("/", (req, res) => {
  res.send("NeuroVault Backend is Live 🚀");
});