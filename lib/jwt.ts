import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!; 

export function signToken(payload: object, p0: string) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

interface DecodedToken {
  userId: string;   
  role?: string;
}

export function verifyToken(token: string): DecodedToken {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded as DecodedToken;
}