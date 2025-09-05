import { Router } from "express";
import { generateToken, comparePassword } from "../auth/jwt.js";
import { store } from "../store.js";
import { validateLogin } from "../validation.js";

const router = Router();

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes working",
    users: mockUsers.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
    })),
  });
});

// Mock users - i produktion skulle detta komma från en databas
const mockUsers = [
  {
    id: "staff-1",
    username: "admin",
    password: "$2b$12$KZCZSOrdXIYDDjD7FqziVOEBbf.lszuaaKZLsH.tdOMH/71Qsp8zy", // "password123"
    role: "admin",
    staffId: "dev-1",
  },
  {
    id: "staff-2",
    username: "staff",
    password: "$2b$12$KZCZSOrdXIYDDjD7FqziVOEBbf.lszuaaKZLsH.tdOMH/71Qsp8zy", // "password123"
    role: "staff",
    staffId: "dev-2",
  },
];

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", {
      username,
      password: password ? "***" : "undefined",
    });

    // Validera input med Zod
    validateLogin({ username, password });

    // Hitta användare
    const user = mockUsers.find((u) => u.username === username);
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Verifiera lösenord
    const isValidPassword = await comparePassword(password, user.password);
    console.log("Password validation:", {
      isValid: isValidPassword,
      provided: password,
      stored: user.password,
    });
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generera JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      staffId: user.staffId,
    });

    // Sätt cookie för development
    res.cookie("devToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 timmar
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        staffId: user.staffId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("devToken");
  res.json({ success: true });
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  const token =
    req.cookies.devToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const { verifyToken } = await import("../auth/jwt.js");
    const payload = verifyToken(token);
    res.json({ valid: true, user: payload });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
