import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { databaseService } from "./database.js";
import type { User } from "../../shared/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production";
const JWT_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };
    return jwt.sign(payload, JWT_SECRET);
  }

  generateRefreshToken(userId: string): { token: string; tokenId: string } {
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = {
      userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };
    const token = jwt.sign(payload, JWT_REFRESH_SECRET);
    
    // Store refresh token
    this.refreshTokens.set(tokenId, {
      userId,
      expiresAt: new Date(payload.exp * 1000),
    });

    return { token, tokenId };
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await databaseService.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async login(username: string, password: string): Promise<{
    user: Omit<User, "passwordHash">;
    accessToken: string;
    refreshToken: string;
  } | null> {
    const user = await this.authenticateUser(username, password);
    if (!user) {
      return null;
    }

    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken } = this.generateRefreshToken(user.id);

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const storedToken = this.refreshTokens.get(payload.tokenId);
    if (!storedToken || storedToken.userId !== payload.userId) {
      return null;
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({ id: payload.userId } as User);
    const { token: newRefreshToken, tokenId: newTokenId } = this.generateRefreshToken(payload.userId);

    // Remove old refresh token and add new one
    this.refreshTokens.delete(payload.tokenId);
    this.refreshTokens.set(newTokenId, {
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<boolean> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (payload) {
      this.refreshTokens.delete(payload.tokenId);
      return true;
    }
    return false;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await databaseService.getUserByUsername(userId);
    if (!user) {
      return false;
    }

    const isValidCurrentPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      return false;
    }

    const newPasswordHash = await this.hashPassword(newPassword);
    const updatedUser = await databaseService.updateUserPassword(userId, newPasswordHash);
    return !!updatedUser;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User | null> {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      const user = await databaseService.createUser({
        ...userData,
        passwordHash: hashedPassword,
      });
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  }

  // Clean up expired refresh tokens
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [tokenId, tokenData] of this.refreshTokens.entries()) {
      if (tokenData.expiresAt < now) {
        this.refreshTokens.delete(tokenId);
      }
    }
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    const user = await databaseService.getUserByUsername(payload.username);
    return user || null;
  }
}

export const authService = new AuthService();

// Clean up expired tokens every hour
setInterval(() => {
  authService.cleanupExpiredTokens();
}, 60 * 60 * 1000);