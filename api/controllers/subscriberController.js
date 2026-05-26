import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Subscriber from "../models/subscriberModel.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createUnsubscribeToken = () => crypto.randomBytes(32).toString("hex");

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const normalizePreferredChannels = (channels, phone) => {
  const incoming = Array.isArray(channels) ? channels : [];
  const normalized = new Set(["email"]);

  if (phone && incoming.includes("whatsapp")) {
    normalized.add("whatsapp");
  }

  return Array.from(normalized);
};

const safeSubscriber = (subscriber) => ({
  email: subscriber.email,
  status: subscriber.status,
  preferredChannels: subscriber.preferredChannels,
});

export const subscribe = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const name = req.body.name?.trim() || "";
  const phone = req.body.phone?.trim() || "";
  const source = req.body.source?.trim() || "website";
  const preferredChannels = normalizePreferredChannels(req.body.preferredChannels, phone);

  if (!email || !EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  const now = new Date();
  const existingSubscriber = await Subscriber.findOne({ email });

  if (existingSubscriber) {
    existingSubscriber.name = name || existingSubscriber.name;
    existingSubscriber.phone = phone || existingSubscriber.phone;
    existingSubscriber.preferredChannels = preferredChannels;
    existingSubscriber.source = source;
    existingSubscriber.status = "active";
    existingSubscriber.consentAt = now;
    existingSubscriber.lastSubscribedAt = now;
    existingSubscriber.unsubscribedAt = undefined;
    existingSubscriber.unsubscribeToken =
      existingSubscriber.unsubscribeToken || createUnsubscribeToken();

    const subscriber = await existingSubscriber.save();

    return res.status(200).json({
      message: "Thank you for subscribing.",
      subscriber: safeSubscriber(subscriber),
    });
  }

  const subscriber = await Subscriber.create({
    email,
    name,
    phone,
    source,
    preferredChannels,
    status: "active",
    consentAt: now,
    lastSubscribedAt: now,
    unsubscribeToken: createUnsubscribeToken(),
  });

  res.status(201).json({
    message: "Thank you for subscribing.",
    subscriber: safeSubscriber(subscriber),
  });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findOne({
    unsubscribeToken: req.params.token,
  });

  if (!subscriber) {
    res.status(404);
    throw new Error("Subscriber not found.");
  }

  subscriber.status = "unsubscribed";
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  res.status(200).json({ message: "You have been unsubscribed." });
});

export const unsubscribeByEmail = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email || !EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  await Subscriber.findOneAndUpdate(
    { email },
    {
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    }
  );

  res.status(200).json({
    message: "If this email is subscribed, it has been unsubscribed.",
  });
});

export const getAdminSubscribers = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const query = {};

  if (["active", "unsubscribed"].includes(status)) {
    query.status = status;
  }

  if (q?.trim()) {
    const searchRegex = new RegExp(q.trim(), "i");
    query.$or = [
      { email: searchRegex },
      { name: searchRegex },
      { phone: searchRegex },
    ];
  }

  const subscribers = await Subscriber.find(query).sort({ createdAt: -1 });

  res.status(200).json(subscribers);
});

export const updateAdminSubscriber = asyncHandler(async (req, res) => {
  const { status, name, phone, preferredChannels, notes } = req.body;
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    res.status(404);
    throw new Error("Subscriber not found.");
  }

  if (status !== undefined) {
    if (!["active", "unsubscribed"].includes(status)) {
      res.status(400);
      throw new Error("Invalid subscriber status.");
    }
    subscriber.status = status;
    subscriber.unsubscribedAt = status === "unsubscribed" ? new Date() : undefined;
  }

  if (name !== undefined) subscriber.name = name.trim();
  if (phone !== undefined) subscriber.phone = phone.trim();
  if (notes !== undefined) subscriber.notes = notes.trim();
  if (preferredChannels !== undefined) {
    subscriber.preferredChannels = normalizePreferredChannels(
      preferredChannels,
      phone ?? subscriber.phone
    );
  }

  await subscriber.save();

  res.status(200).json(subscriber);
});

export const deleteAdminSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);

  if (!subscriber) {
    res.status(404);
    throw new Error("Subscriber not found.");
  }

  res.status(200).json({ message: "Subscriber deleted." });
});
