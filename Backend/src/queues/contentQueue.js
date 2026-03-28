import { Queue } from 'bullmq'
import redis from '../config/redis.js'

const contentQueue = new Queue('content-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
})

export default contentQueue