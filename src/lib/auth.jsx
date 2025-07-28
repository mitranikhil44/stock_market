import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || "one_world_one_family";
const ADMIN_ID = process.env.ADMIN_ID;

// Generate a JWT token for the user
export const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
};

// Verify the JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

// Hash the user's password
export const hashPassword = (password) => {
  return bcrypt.hash(password, 10);
};

// Compare the candidate password with the hashed password
export const comparePassword = (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

// Check if the user is an admin
export const checkAdminAuth = (headers) => {
  const adminToken = headers.get('x-token');
  const decodedToken = verifyToken(adminToken);

  if (!decodedToken || decodedToken.role !== 'admin' || decodedToken.id !== ADMIN_ID) {
    throw new Error('Unauthorized');
  }
};
