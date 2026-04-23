import mongoose from "mongoose";

let initialized = false;
let mongoReady = false;

function ensureModels() {
  if (mongoose.models.EwProduct && mongoose.models.EwCustomer && mongoose.models.EwOrder) {
    return {
      Product: mongoose.models.EwProduct,
      Customer: mongoose.models.EwCustomer,
      Order: mongoose.models.EwOrder,
    };
  }

  const productSchema = new mongoose.Schema({
    userId: { type: Number, required: true, index: true },
    projectId: { type: Number, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    stock: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  }, { timestamps: true });

  const customerSchema = new mongoose.Schema({
    userId: { type: Number, required: true, index: true },
    projectId: { type: Number, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
  }, { timestamps: true });

  const orderSchema = new mongoose.Schema({
    userId: { type: Number, required: true, index: true },
    projectId: { type: Number, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "EwCustomer", required: false },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "EwProduct" },
      name: { type: String, required: true },
      qty: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    }],
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, default: "pending", enum: ["pending", "processing", "paid", "failed", "cancelled", "refunded"] },
    paymentGateway: { type: String, default: "razorpay" },
    paymentRef: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    gatewayPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  }, { timestamps: true });

  productSchema.index({ userId: 1, projectId: 1, name: 1 });
  customerSchema.index({ userId: 1, projectId: 1, email: 1 });
  orderSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

  return {
    Product: mongoose.model("EwProduct", productSchema),
    Customer: mongoose.model("EwCustomer", customerSchema),
    Order: mongoose.model("EwOrder", orderSchema),
  };
}

export async function initMongo(uri) {
  if (initialized) return { ready: mongoReady };
  initialized = true;

  const mongoUri = String(uri || "").trim();
  if (!mongoUri) {
    mongoReady = false;
    return { ready: false, reason: "MONGODB_URI not configured" };
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 4000,
    });
    ensureModels();
    mongoReady = true;
    return { ready: true };
  } catch (error) {
    mongoReady = false;
    return { ready: false, reason: error?.message || "MongoDB connection failed" };
  }
}

export function isMongoReady() {
  return mongoReady;
}

export function getMongoModels() {
  return ensureModels();
}
