import { initAppSchema } from '../src/utils/appSchema.js';

initAppSchema()
  .catch((error) => {
    console.error('Error initializing SSOR app schema:', error);
    process.exit(1);
  });
