import { Router } from "express";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { db } from "../db.js";
import { users, type InsertUser } from "../../shared/schema.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const userRoutes = Router();

// Apply authentication to all user routes
userRoutes.use(requireAuth);

// === USER MANAGEMENT (Admin only) ===
userRoutes.get("/", requireRole('admin'), async (req, res) => {
  try {
    const { search, role, active, sort = "username", order = "asc" } = req.query;
    
    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);
    
    const conditions = [];
    
    // Add search functionality
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    
    // Filter by role
    if (role && typeof role === "string") {
      conditions.push(eq(users.role, role));
    }
    
    // Filter by active status
    if (active !== undefined) {
      conditions.push(eq(users.isActive, active === "true"));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    const orderFn = order === "desc" ? desc : sql`ASC`;
    if (sort === "username") {
      query = query.orderBy(sql`${users.username} ${orderFn}`);
    } else if (sort === "email") {
      query = query.orderBy(sql`${users.email} ${orderFn}`);
    } else if (sort === "createdAt") {
      query = query.orderBy(sql`${users.createdAt} ${orderFn}`);
    }
    
    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av användare" });
  }
});

userRoutes.get("/:id", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, id)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av användare" });
  }
});

userRoutes.post("/", requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role = 'staff' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Användarnamn, e-post och lösenord krävs" });
    }
    
    // Check if username or email already exists
    const existingUser = await db.select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Användarnamn eller e-post finns redan" });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const userData: InsertUser = {
      id: `user_${randomUUID()}`,
      username,
      email,
      passwordHash,
      role,
      isActive: true
    };
    
    const result = await db.insert(users).values(userData).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    });
    
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ error: "Fel vid skapande av användare" });
  }
});

userRoutes.put("/:id", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive, password } = req.body;
    
    const updates: any = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    
    // Hash new password if provided
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Inga uppdateringar angivna" });
    }
    
    updates.updatedAt = sql`NOW()`;
    
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt
      });
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av användare" });
  }
});

userRoutes.delete("/:id", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    
    // Prevent deleting yourself
    if (id === currentUser.id) {
      return res.status(400).json({ error: "Du kan inte ta bort ditt eget konto" });
    }
    
    // Deactivate instead of delete
    const result = await db
      .update(users)
      .set({ isActive: false, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    
    return res.json({ message: "Användare inaktiverad" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ error: "Fel vid borttagning av användare" });
  }
});

userRoutes.post("/:id/activate", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(users)
      .set({ isActive: true, updatedAt: sql`NOW()` })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt
      });
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Activate user error:", error);
    return res.status(500).json({ error: "Fel vid aktivering av användare" });
  }
});

// === PROFILE MANAGEMENT (Self-service) ===
userRoutes.get("/profile/me", async (req, res) => {
  try {
    const currentUser = (req as any).user;
    
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, currentUser.id)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av profil" });
  }
});

userRoutes.put("/profile/me", async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { email, currentPassword, newPassword } = req.body;
    
    // Verify current password if changing password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Nuvarande lösenord krävs för att ändra lösenord" });
      }
      
      const user = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "Användare hittades inte" });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Felaktigt nuvarande lösenord" });
      }
    }
    
    const updates: any = {};
    if (email) updates.email = email;
    if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Inga uppdateringar angivna" });
    }
    
    updates.updatedAt = sql`NOW()`;
    
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, currentUser.id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        updatedAt: users.updatedAt
      });
    
    return res.json(result[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Fel vid uppdatering av profil" });
  }
});

export default userRoutes;
