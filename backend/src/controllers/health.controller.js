import prisma from '../config/db.js';

export const checkHealth = async (req, res) => {
  try {
    // Verify database connection is alive
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      success: true,
      message: 'SSOR Backend is running successfully',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'SSOR Backend running, but Database Connection Failed',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
