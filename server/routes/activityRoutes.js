export function registerActivityRoutes({ app, authMiddleware, statements, saveActivity }) {
  app.post("/api/activity", authMiddleware, (req, res) => {
    const { action, metadata = {} } = req.body || {};
    if (!action || typeof action !== "string") {
      return res.status(400).json({ error: "Action is required" });
    }
    saveActivity(req.user.id, action, metadata);
    return res.json({ ok: true });
  });

  app.get("/api/activity", authMiddleware, (req, res) => {
    const rawLimit = Number(req.query.limit || 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
    const rows = statements.getActivities.all(req.user.id, limit);
    const activities = rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }));
    return res.json({ activities });
  });
}
