const WEBSITE_EDIT_SYSTEM_PROMPT = `You edit existing full HTML websites.
Rules:
- Return ONLY complete HTML, no markdown, no explanations.
- Keep current structure, scripts, and styles unless changes are requested.
- Apply the user's requested changes precisely.
- Keep document valid and responsive.`;

export function registerProjectRoutes({
  app,
  authMiddleware,
  statements,
  saveActivity,
  parseNullableText,
  normalizeSlug,
  extractSlugFromPublishedUrl,
  persistWebsiteHtmlIfPublished,
  persistProjectZip,
  safeJsonParse,
  ai,
  extractHtmlFromModelResponse,
}) {
  app.post("/api/projects", authMiddleware, async (req, res) => {
    const {
      id,
      type = "website",
      name,
      slug = null,
      htmlContent = "",
      projectFiles = {},
      mobileCode = "",
      demoApkNotes = "",
      aabNotes = "",
      publishedUrl = null,
    } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }
    if (!["website", "app"].includes(type)) {
      return res.status(400).json({ error: "type must be website or app" });
    }

    const normalizedProjectFiles = (projectFiles && typeof projectFiles === "object" && !Array.isArray(projectFiles))
      ? projectFiles
      : {};

    const payload = {
      name: name.trim(),
      slug: parseNullableText(slug),
      htmlContent: typeof htmlContent === "string" ? htmlContent : "",
      projectFiles: JSON.stringify(normalizedProjectFiles),
      mobileCode: typeof mobileCode === "string" ? mobileCode : "",
      demoApkNotes: typeof demoApkNotes === "string" ? demoApkNotes : "",
      aabNotes: typeof aabNotes === "string" ? aabNotes : "",
      publishedUrl: parseNullableText(publishedUrl),
    };
    const effectiveSlug = payload.slug ? normalizeSlug(payload.slug) : extractSlugFromPublishedUrl(payload.publishedUrl);

    if (id) {
      const existing = statements.getProjectById.get(Number(id), req.user.id);
      if (!existing) return res.status(404).json({ error: "Project not found" });
      const existingSlug = normalizeSlug(parseNullableText(existing.slug));
      const fallbackSlug = extractSlugFromPublishedUrl(existing.published_url);
      const finalSlug = effectiveSlug || existingSlug || fallbackSlug || null;

      statements.updateProject.run(
        payload.name,
        finalSlug,
        payload.htmlContent,
        payload.projectFiles,
        payload.mobileCode,
        payload.demoApkNotes,
        payload.aabNotes,
        payload.publishedUrl,
        Number(id),
        req.user.id,
      );
      if (type === "website" && finalSlug && payload.htmlContent) {
        persistWebsiteHtmlIfPublished({ slug: finalSlug }, payload.htmlContent);
      }
      let zipPath = existing.zip_path || null;
      try {
        zipPath = await persistProjectZip({
          projectId: Number(id),
          userId: req.user.id,
          slug: finalSlug || payload.name,
          projectFiles: normalizedProjectFiles,
          htmlContent: payload.htmlContent,
        });
      } catch {
        // Keep project save successful even if zip generation fails.
      }
      saveActivity(req.user.id, "Updated project", { projectId: Number(id), type });
      return res.json({ id: Number(id), updated: true, zipPath });
    }

    const result = statements.insertProject.run(
      req.user.id,
      type,
      payload.name,
      effectiveSlug,
      payload.htmlContent,
      payload.projectFiles,
      payload.mobileCode,
      payload.demoApkNotes,
      payload.aabNotes,
      payload.publishedUrl,
    );
    const projectId = Number(result.lastInsertRowid);
    let zipPath = null;
    try {
      zipPath = await persistProjectZip({
        projectId,
        userId: req.user.id,
        slug: effectiveSlug || payload.name,
        projectFiles: normalizedProjectFiles,
        htmlContent: payload.htmlContent,
      });
    } catch {
      // Keep project creation successful even if zip generation fails.
    }
    if (type === "website" && effectiveSlug && payload.htmlContent) {
      persistWebsiteHtmlIfPublished({ slug: effectiveSlug }, payload.htmlContent);
    }
    saveActivity(req.user.id, "Created project", { projectId, type, name: payload.name });
    return res.json({ id: projectId, created: true, zipPath });
  });

  app.get("/api/projects", authMiddleware, (req, res) => {
    const type = req.query.type && ["website", "app"].includes(req.query.type) ? req.query.type : null;
    const projects = statements.getProjectsByUser.all(req.user.id, type, type);
    return res.json({ projects });
  });

  app.get("/api/projects/:id", authMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid project id" });
    const project = statements.getProjectById.get(id, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    return res.json({
      project: {
        ...project,
        project_files: safeJsonParse(project.project_files, {}),
      },
    });
  });

  app.delete("/api/projects/:id", authMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid project id" });
    
    const project = statements.getProjectById.get(id, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const stmt = req.app.get("db")?.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
    if (!stmt) {
      // fallback if db is not in req.app
      try {
        statements.updateProject.database.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, req.user.id);
      } catch(e) {
        return res.status(500).json({ error: "Could not delete project" });
      }
    } else {
      stmt.run(id, req.user.id);
    }
    
    saveActivity(req.user.id, "Deleted project", { projectId: id, name: project.name });
    return res.json({ ok: true, deleted: true });
  });

  app.post("/api/projects/:id/store-zip", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid project id" });

    const project = statements.getProjectById.get(id, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const requestFiles = req.body?.projectFiles;
    const files = (requestFiles && typeof requestFiles === "object" && !Array.isArray(requestFiles))
      ? requestFiles
      : safeJsonParse(project.project_files, {});
    const htmlContent = (typeof req.body?.htmlContent === "string" && req.body.htmlContent.trim())
      ? req.body.htmlContent
      : (project.html_content || "");
    const slug = normalizeSlug(project.slug)
      || extractSlugFromPublishedUrl(project.published_url)
      || project.name
      || `project-${id}`;

    try {
      const zipPath = await persistProjectZip({
        projectId: id,
        userId: req.user.id,
        slug,
        projectFiles: files,
        htmlContent,
      });

      if (!zipPath) {
        return res.status(400).json({ error: "No project files available to zip" });
      }

      saveActivity(req.user.id, "Stored project ZIP", { projectId: id, zipPath });
      return res.json({ ok: true, zipPath });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "Failed to store ZIP" });
    }
  });

  app.post("/api/projects/:id/replace", authMiddleware, (req, res) => {
    const id = Number(req.params.id);
    const project = statements.getProjectById.get(id, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.html_content) return res.status(400).json({ error: "Project has no editable HTML content" });

    const { textReplacements = [], imageReplacements = [] } = req.body || {};
    let html = project.html_content;
    let applied = 0;

    for (const item of textReplacements) {
      const from = item?.from;
      const to = item?.to;
      if (!from || typeof from !== "string") continue;
      const next = html.split(from).join(String(to || ""));
      if (next !== html) applied += 1;
      html = next;
    }

    for (const item of imageReplacements) {
      const from = item?.from;
      const to = item?.to;
      if (!from || typeof from !== "string" || !to || typeof to !== "string") continue;
      const next = html.split(from).join(to);
      if (next !== html) applied += 1;
      html = next;
    }

    statements.replaceProjectHtml.run(html, id, req.user.id);

    persistWebsiteHtmlIfPublished(project, html);

    saveActivity(req.user.id, "Edited project content", { projectId: id, applied });
    return res.json({ ok: true, applied });
  });

  app.post("/api/projects/:id/ai-edit", authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const project = statements.getProjectById.get(id, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.html_content) return res.status(400).json({ error: "Project has no editable HTML content" });

    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: WEBSITE_EDIT_SYSTEM_PROMPT,
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
        contents: [{
          role: "user",
          parts: [{
            text: [
              "You are editing this existing website HTML.",
              "",
              "USER CHANGE REQUEST:",
              prompt,
              "",
              "CURRENT HTML:",
              project.html_content,
            ].join("\n"),
          }],
        }],
      });

      const generated = response?.text ?? "";
      const nextHtml = extractHtmlFromModelResponse(generated);
      if (!nextHtml || !nextHtml.toLowerCase().includes("<html")) {
        return res.status(502).json({ error: "AI edit did not return valid HTML" });
      }

      statements.replaceProjectHtml.run(nextHtml, id, req.user.id);
      persistWebsiteHtmlIfPublished(project, nextHtml);
      saveActivity(req.user.id, "AI edited website", { projectId: id, prompt });

      return res.json({ ok: true, htmlContent: nextHtml });
    } catch (error) {
      return res.status(500).json({ error: error?.message || "AI edit failed" });
    }
  });
}
