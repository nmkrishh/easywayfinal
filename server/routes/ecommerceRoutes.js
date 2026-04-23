function parseProjectId(value) {
  const projectId = Number(value);
  return Number.isFinite(projectId) ? projectId : null;
}

function mapGatewayEventToStatus(eventName) {
  const name = String(eventName || "").toLowerCase();
  if (name === "payment.captured" || name === "order.paid") return "paid";
  if (name === "payment.failed") return "failed";
  if (name === "refund.processed") return "refunded";
  if (name === "payment.authorized") return "processing";
  return "pending";
}

export function registerEcommerceRoutes({
  app,
  authMiddleware,
  requireAccess,
  statements,
  saveActivity,
  isMongoReady,
  getMongoModels,
  crypto,
  WEBHOOK_SECRET,
}) {
  const ensureMongo = (res) => {
    if (isMongoReady()) return true;
    res.status(503).json({ error: "MongoDB is not connected. Set MONGODB_URI to enable ecommerce data." });
    return false;
  };

  const ensureProjectOwner = (req, res, projectId) => {
    const project = statements.getProjectById.get(projectId, req.user.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return null;
    }
    return project;
  };

  app.get("/api/ecommerce/products", authMiddleware, async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.query.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Product } = getMongoModels();
    const products = await Product.find({ userId: req.user.id, projectId }).sort({ createdAt: -1 }).lean();
    return res.json({ products });
  });

  app.post("/api/ecommerce/products", authMiddleware, requireAccess({ minRole: "editor" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.body?.projectId);
    const name = String(req.body?.name || "").trim();
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock ?? 0);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: "valid price is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Product } = getMongoModels();
    const product = await Product.create({
      userId: req.user.id,
      projectId,
      name,
      description: String(req.body?.description || ""),
      price,
      currency: String(req.body?.currency || "INR"),
      stock: Number.isFinite(stock) ? stock : 0,
      imageUrl: String(req.body?.imageUrl || ""),
      active: req.body?.active !== false,
    });
    saveActivity(req.user.id, "Added ecommerce product", { projectId, productId: String(product._id), name });
    return res.json({ ok: true, product: product.toObject() });
  });

  app.patch("/api/ecommerce/products/:id", authMiddleware, requireAccess({ minRole: "editor" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.body?.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Product } = getMongoModels();
    const product = await Product.findOne({ _id: req.params.id, userId: req.user.id, projectId });
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (req.body?.name != null) product.name = String(req.body.name || "").trim();
    if (req.body?.description != null) product.description = String(req.body.description || "");
    if (req.body?.price != null) product.price = Number(req.body.price);
    if (req.body?.stock != null) product.stock = Number(req.body.stock);
    if (req.body?.imageUrl != null) product.imageUrl = String(req.body.imageUrl || "");
    if (req.body?.currency != null) product.currency = String(req.body.currency || "INR");
    if (req.body?.active != null) product.active = Boolean(req.body.active);

    if (!product.name) return res.status(400).json({ error: "name is required" });
    if (!Number.isFinite(product.price) || product.price < 0) return res.status(400).json({ error: "valid price is required" });
    if (!Number.isFinite(product.stock) || product.stock < 0) return res.status(400).json({ error: "valid stock is required" });

    await product.save();
    saveActivity(req.user.id, "Updated ecommerce product", { projectId, productId: String(product._id) });
    return res.json({ ok: true, product: product.toObject() });
  });

  app.delete("/api/ecommerce/products/:id", authMiddleware, requireAccess({ minRole: "manager" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.query.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Product } = getMongoModels();
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user.id, projectId });
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    saveActivity(req.user.id, "Deleted ecommerce product", { projectId, productId: String(req.params.id) });
    return res.json({ ok: true });
  });

  app.get("/api/ecommerce/customers", authMiddleware, async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.query.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Customer } = getMongoModels();
    const customers = await Customer.find({ userId: req.user.id, projectId }).sort({ createdAt: -1 }).lean();
    return res.json({ customers });
  });

  app.post("/api/ecommerce/customers", authMiddleware, requireAccess({ minRole: "editor" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.body?.projectId);
    const name = String(req.body?.name || "").trim();
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Customer } = getMongoModels();
    const customer = await Customer.create({
      userId: req.user.id,
      projectId,
      name,
      email: String(req.body?.email || ""),
      phone: String(req.body?.phone || ""),
      notes: String(req.body?.notes || ""),
    });
    saveActivity(req.user.id, "Added ecommerce customer", { projectId, customerId: String(customer._id) });
    return res.json({ ok: true, customer: customer.toObject() });
  });

  app.get("/api/ecommerce/orders", authMiddleware, async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.query.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Order } = getMongoModels();
    const orders = await Order.find({ userId: req.user.id, projectId }).sort({ createdAt: -1 }).lean();
    return res.json({ orders });
  });

  app.post("/api/ecommerce/orders", authMiddleware, requireAccess({ minRole: "editor" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.body?.projectId);
    const amount = Number(req.body?.amount);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "valid amount is required" });
    if (!items.length) return res.status(400).json({ error: "items are required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Order } = getMongoModels();
    const order = await Order.create({
      userId: req.user.id,
      projectId,
      customerId: req.body?.customerId || null,
      items,
      amount,
      status: String(req.body?.status || "pending"),
      paymentGateway: String(req.body?.paymentGateway || "razorpay"),
      paymentRef: String(req.body?.paymentRef || ""),
      paymentMethod: String(req.body?.paymentMethod || ""),
      paidAt: req.body?.paidAt ? new Date(req.body.paidAt) : null,
    });
    saveActivity(req.user.id, "Recorded ecommerce order", { projectId, orderId: String(order._id), amount });
    return res.json({ ok: true, order: order.toObject() });
  });

  app.post("/api/ecommerce/orders/:id/sync-payment", authMiddleware, requireAccess({ minRole: "manager" }), async (req, res) => {
    if (!ensureMongo(res)) return;
    const projectId = parseProjectId(req.body?.projectId);
    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!ensureProjectOwner(req, res, projectId)) return;
    const { Order } = getMongoModels();
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id, projectId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const nextStatus = String(req.body?.status || "").toLowerCase();
    if (nextStatus) order.status = nextStatus;
    if (req.body?.paymentRef != null) order.paymentRef = String(req.body.paymentRef || "");
    if (req.body?.paymentMethod != null) order.paymentMethod = String(req.body.paymentMethod || "");
    if (req.body?.paymentGateway != null) order.paymentGateway = String(req.body.paymentGateway || "razorpay");
    if (order.status === "paid" && !order.paidAt) order.paidAt = new Date();
    order.gatewayPayload = req.body?.gatewayPayload || order.gatewayPayload || null;
    await order.save();

    saveActivity(req.user.id, "Synced payment status", { projectId, orderId: String(order._id), status: order.status });
    return res.json({ ok: true, order: order.toObject() });
  });

  app.post("/api/ecommerce/payments/webhook", async (req, res) => {
    if (!ensureMongo(res)) return;

    if (!WEBHOOK_SECRET) {
      return res.status(503).json({ error: "RAZORPAY_WEBHOOK_SECRET is not configured" });
    }

    const signature = String(req.headers["x-razorpay-signature"] || "");
    const rawBody = String(req.rawBody || "");
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expected) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const eventName = String(req.body?.event || "");
    const payload = req.body?.payload || {};
    const paymentEntity = payload?.payment?.entity || {};
    const orderEntity = payload?.order?.entity || {};
    const paymentId = String(paymentEntity?.id || "");
    const paymentOrderId = String(paymentEntity?.order_id || orderEntity?.id || "");
    const orderHintId = String(paymentEntity?.notes?.easyway_order_id || orderEntity?.notes?.easyway_order_id || "");
    const mappedStatus = mapGatewayEventToStatus(eventName);

    const { Order } = getMongoModels();

    let order = null;
    if (orderHintId) {
      order = await Order.findById(orderHintId);
    }
    if (!order && paymentId) {
      order = await Order.findOne({ paymentRef: paymentId });
    }
    if (!order && paymentOrderId) {
      order = await Order.findOne({ paymentRef: paymentOrderId });
    }

    if (!order) {
      return res.status(202).json({ ok: true, ignored: true, reason: "No matching order" });
    }

    order.status = mappedStatus;
    if (paymentId) order.paymentRef = paymentId;
    order.paymentGateway = "razorpay";
    if (paymentEntity?.method) order.paymentMethod = String(paymentEntity.method);
    if (mappedStatus === "paid" && !order.paidAt) order.paidAt = new Date();
    order.gatewayPayload = req.body || {};
    await order.save();

    return res.json({ ok: true, orderId: String(order._id), status: order.status });
  });
}
