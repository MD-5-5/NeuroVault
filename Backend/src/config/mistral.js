import { Mistral } from '@mistralai/mistralai'
import dotenv from 'dotenv'
dotenv.config()

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

export default mistral