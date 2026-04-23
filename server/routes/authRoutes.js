export function registerAuthRoutes({ app, statements, authMiddleware, createSession, saveActivity, bcrypt }) {
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name = "" } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = statements.getUserByEmail.get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = statements.insertUser.run(String(name || "").trim(), normalizedEmail, hash);
    const user = statements.getUserById.get(result.lastInsertRowid);
    saveActivity(user.id, "Signed up", { email: user.email });

    return res.json(createSession(user));
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = statements.getUserByEmail.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    saveActivity(user.id, "Logged in");
    return res.json(createSession(user));
  });

  app.get("/api/auth/session", authMiddleware, (req, res) => {
    return res.json({
      session: {
        user: {
          id: req.user.id,
          name: req.user.name || "",
          email: req.user.email,
          role: req.access?.role || "owner",
          plan: req.access?.plan || "starter",
          profileImageUrl: req.userSettings?.profile_image_url || "",
          twoFactorEnabled: Boolean(Number(req.userSettings?.two_factor_enabled || 0)),
        },
      },
    });
  });

  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    saveActivity(req.user.id, "Logged out");
    return res.json({ ok: true });
  });
}
