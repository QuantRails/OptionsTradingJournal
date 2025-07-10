import type { Request, Response, NextFunction } from "express";
import session from "express-session";

// Default credentials for development
// IMPORTANT: Change these credentials in production!
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "change-this-password-in-production"
};

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // HTTP for now - set to true when you add HTTPS
      maxAge: 8 * 60 * 60 * 1000, // 8 hours for security
    },
  });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).authenticated) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
}

export function login(req: Request, res: Response) {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    if (req.session) {
      (req.session as any).authenticated = true;
      (req.session as any).user = { username };
    }
    res.json({ success: true, user: { username } });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
}

export function logout(req: Request, res: Response) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Could not log out" });
      } else {
        res.json({ success: true });
      }
    });
  } else {
    res.json({ success: true });
  }
}

export function getUser(req: Request, res: Response) {
  if (req.session && (req.session as any).authenticated) {
    res.json((req.session as any).user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
}