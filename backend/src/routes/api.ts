import { Router, Request, Response, NextFunction } from "express";
import { GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { repository } from "../repositories";
import { isAWSMode, cognitoClient, JWT_SECRET } from "../config/aws";
import { orchestrator } from "../services/ai/Orchestrator";
import { Habit } from "../repositories/interfaces/Repository";

const router = Router();

// Extend Express Request type
interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(" ")[1];

  if (isAWSMode()) {
    if (!cognitoClient) {
      return res.status(500).json({ error: "Cognito Client uninitialized" });
    }
    try {
      // Validate access token by fetching User details from Cognito
      const command = new GetUserCommand({ AccessToken: token });
      const response = await cognitoClient.send(command);
      
      // Resolve email from user attributes
      const emailAttr = response.UserAttributes?.find(attr => attr.Name === "email");
      
      // Set userId as the Username (which is the Cognito UUID)
      req.userId = response.Username;
      req.userEmail = emailAttr?.Value || "";
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid Cognito session token", details: err });
    }
  } else {
    // Local JWT Verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid local session token" });
    }
  }
};

// ==========================================
// AUTHENTICATION ENDPOINTS — EMAIL + PASSWORD
// ==========================================

// SIGN-UP: Register a new user with email and password
router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check if user already exists
    const existing = await repository.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const user = { id: userId, email, passwordHash, createdAt: new Date().toISOString() };
    await repository.createUser(user);
    console.log(`[Auth] New user registered: ${email} (${userId})`);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ token, email: user.email, userId: user.id });
  } catch (err: any) {
    console.error("[Auth] Sign-up error:", err.message);
    return res.status(500).json({ error: "Registration failed.", details: err.message });
  }
});

// SIGN-IN: Authenticate an existing user with email and password
router.post("/auth/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await repository.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: "This account does not have a password set. Please contact support." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    console.log(`[Auth] User signed in: ${email}`);
    return res.json({ token, email: user.email, userId: user.id });
  } catch (err: any) {
    console.error("[Auth] Sign-in error:", err.message);
    return res.status(500).json({ error: "Authentication failed.", details: err.message });
  }
});


// GET CURRENT USER PROFILE INFO
router.get("/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
  res.json({ userId: req.userId, email: req.userEmail });
});

// ==========================================
// PROFILE ENDPOINTS
// ==========================================
router.get("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const profile = await repository.getProfile(req.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  return res.json(profile);
});

router.post("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, age, gender, country, education, occupation, income, relationshipStatus } = req.body;
  if (!name || !age || !gender) {
    return res.status(400).json({ error: "Name, Age, and Gender are required" });
  }

  const profile = await repository.saveProfile({
    userId: req.userId!,
    name,
    age: Number(age),
    gender,
    country: country || "",
    education: education || "",
    occupation: occupation || "",
    income: Number(income || 0),
    relationshipStatus: relationshipStatus || ""
  });
  return res.json(profile);
});

// ==========================================
// ASSESSMENT ENDPOINTS
// ==========================================
router.get("/assessment", requireAuth, async (req: AuthRequest, res: Response) => {
  const assessment = await repository.getAssessment(req.userId!);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });
  return res.json(assessment);
});

router.post("/assessment", requireAuth, async (req: AuthRequest, res: Response) => {
  const { health, career, finance, relationships, growth, goals } = req.body;
  if (!health || !career || !finance || !relationships || !growth || !goals) {
    return res.status(400).json({ error: "Full assessment data is required" });
  }

  const assessment = await repository.saveAssessment({
    userId: req.userId!,
    health,
    career,
    finance,
    relationships,
    growth,
    goals,
    updatedAt: new Date().toISOString()
  });
  return res.json(assessment);
});

// ==========================================
// HABIT ENDPOINTS
// ==========================================
router.get("/habits", requireAuth, async (req: AuthRequest, res: Response) => {
  const habits = await repository.getHabits(req.userId!);
  return res.json(habits);
});

router.post("/habits", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, type, frequency, duration, consistencyScore } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Habit name and type ('positive' | 'negative') are required" });
  }

  const newHabit: Habit = {
    id: `habit_${Math.random().toString(36).substring(2, 11)}`,
    userId: req.userId!,
    name,
    type,
    frequency: frequency || "daily",
    duration: Number(duration || 0),
    consistencyScore: Number(consistencyScore || 50),
    createdAt: new Date().toISOString()
  };

  const saved = await repository.saveHabit(newHabit);
  return res.status(201).json(saved);
});

router.put("/habits/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, type, frequency, duration, consistencyScore } = req.body;
  const habits = await repository.getHabits(req.userId!);
  const existing = habits.find(h => h.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Habit not found" });

  const updated: Habit = {
    id: req.params.id,
    userId: req.userId!,
    name: name || existing.name,
    type: type || existing.type,
    frequency: frequency || existing.frequency,
    duration: duration !== undefined ? Number(duration) : existing.duration,
    consistencyScore: consistencyScore !== undefined ? Number(consistencyScore) : existing.consistencyScore,
    createdAt: existing.createdAt
  };

  const saved = await repository.saveHabit(updated);
  return res.json(saved);
});

router.delete("/habits/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const success = await repository.deleteHabit(req.userId!, req.params.id);
  if (!success) return res.status(404).json({ error: "Habit not found" });
  return res.json({ message: "Habit deleted successfully" });
});

// ==========================================
// SIMULATION ENGINE ROUTING
// ==========================================
router.post("/simulations/run", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // 1. Gather all inputs
  const profile = await repository.getProfile(userId);
  const assessment = await repository.getAssessment(userId);
  const habits = await repository.getHabits(userId);

  if (!profile || !assessment) {
    return res.status(400).json({ error: "Profile and assessment data are required to run simulation" });
  }

  // 2. Trigger multi-agent pipeline
  try {
    const report = await orchestrator.runLifeSimulation(userId, profile, assessment, habits);
    await repository.saveSimulation(report);
    return res.json(report);
  } catch (err: any) {
    console.error("Simulation generation error:", err);
    return res.status(500).json({ error: "Simulation generation failed", details: err.message });
  }
});

router.get("/simulations/latest", requireAuth, async (req: AuthRequest, res: Response) => {
  const latest = await repository.getLatestSimulation(req.userId!);
  if (!latest) return res.status(404).json({ error: "No simulations run yet" });
  return res.json(latest);
});

router.get("/simulations/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const history = await repository.getSimulationHistory(req.userId!);
  return res.json(history);
});

// ==========================================
// WHAT-IF ENGINE
// ==========================================
router.post("/simulations/whatif", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query string is required" });

  const profile = await repository.getProfile(userId);
  const assessment = await repository.getAssessment(userId);
  const habits = await repository.getHabits(userId);
  const latestReport = await repository.getLatestSimulation(userId);

  if (!profile || !assessment) {
    return res.status(400).json({ error: "Profile and assessment required to run what-if simulation" });
  }

  try {
    const result = await orchestrator.runWhatIfSimulation(userId, profile, assessment, habits, latestReport, query);
    await repository.saveWhatIf(result);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "What-If simulation failed", details: err.message });
  }
});

router.get("/simulations/whatif/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const history = await repository.getWhatIfHistory(req.userId!);
  return res.json(history);
});

// ==========================================
// AI CHAT ASSISTANT (No auth required)
// ==========================================
const CHAT_SYSTEM_PROMPT = `You are a friendly and knowledgeable AI assistant for the Future Self Simulator platform. 

CRITICAL DIRECTIVE: Your role is EXCLUSIVELY to help users understand, navigate, and troubleshoot this platform. You must NOT answer general questions, write code, tell stories, or discuss topics unrelated to the Future Self Simulator. If a user asks an off-topic question, politely decline and steer them back to how they can use this platform.

About Future Self Simulator:
- It's an AI-powered life simulation platform that helps users visualize how their current habits, decisions, career choices, financial behavior, and health practices may influence their future over 1, 5, and 10 years.
- It uses a multi-agent AI system powered by Groq (llama-3.3-70b-versatile) to generate personalized life simulations
- All projections are possible future scenarios based on inputs, patterns, and behavioral trends — NOT certain predictions

Key Features you help users with:
1. Account Login: Users sign in or create an account with their email and password (secure, no OTP needed)
2. Life Assessment: A multi-step wizard where users input health, career, finance, relationships, and personal growth data
3. Habit Tracker: Users log positive and negative habits with frequency and consistency scores
4. AI Simulation Dashboard: After completing assessment + habits, users run the AI simulation to get:
   - Life scores (health, career, finance, relationships, growth, risk scores)
   - Future probability predictions (promotion, income growth, burnout risk, etc.)
   - Three timeline stories (1-year, 5-year, 10-year future narratives)
   - A Future Avatar persona (who you become in 10 years)
   - A personal letter from your future self
5. What-If Simulator: Users ask hypothetical questions like 'What if I moved abroad?' or 'What if I started a business?' and get AI-generated alternate future scenarios

How to use the platform step-by-step:
1. Go to the homepage and click 'Start Your Journey'
2. Go to the homepage, enter your email and password to sign in (or create a new account)
3. Complete your profile (name, age, occupation, etc.)
4. Fill in the Life Assessment wizard (5 sections)
5. Add your habits in the Habit Tracker
6. Go to Dashboard and click 'Run AI Simulation'
7. Explore your future timelines, scores, and avatar
8. Try the What-If Simulator for alternate scenarios

Tone: Be warm, encouraging, and concise. Keep responses under 150 words. Politely decline any off-topic queries.`;

router.post("/chat", async (req: Request, res: Response) => {
  const { messages } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[/api/chat] Groq API error:", groqRes.status, errText);
      return res.status(500).json({ error: "Groq API request failed", details: errText });
    }

    const data = await groqRes.json() as {
      choices: { message: { content: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content ?? "";
    return res.json({ reply });
  } catch (err: any) {
    console.error("[/api/chat] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default router;

