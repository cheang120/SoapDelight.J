import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Subscriber from "../models/subscriberModel.js";
import User from "../models/user.model.js";

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

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.query.email);

  if (!email || !EMAIL_PATTERN.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address.");
  }

  const subscriber = await Subscriber.findOne({ email })
    .select("email phone status preferredChannels")
    .lean();

  if (!subscriber) {
    return res.status(200).json({
      email,
      status: "not_subscribed",
      preferredChannels: [],
      phone: "",
    });
  }

  res.status(200).json({
    email: subscriber.email,
    status: subscriber.status,
    preferredChannels:
      subscriber.status === "active" ? subscriber.preferredChannels || [] : [],
    phone: subscriber.phone || "",
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

export const getAdminSubscriberOverview = asyncHandler(async (req, res) => {
  const { status = "all", q = "" } = req.query;
  const userQuery = {};
  const subscriberQuery = {};

  if (q.trim()) {
    const searchRegex = new RegExp(q.trim(), "i");
    userQuery.$or = [
      { email: searchRegex },
      { username: searchRegex },
      { phone: searchRegex },
    ];
    subscriberQuery.$or = [
      { email: searchRegex },
      { name: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [users, subscribers] = await Promise.all([
    User.find(userQuery)
      .select("_id email username phone createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    Subscriber.find(subscriberQuery)
      .select("email name phone status preferredChannels source lastSubscribedAt unsubscribedAt createdAt")
      .lean(),
  ]);

  const subscriberMap = new Map(
    subscribers.map((subscriber) => [normalizeEmail(subscriber.email), subscriber])
  );

  const registeredRows = users.map((user) => {
    const mergedEmail = normalizeEmail(user.email);
    const subscriber = subscriberMap.get(mergedEmail);
    const subscriptionStatus = subscriber
      ? subscriber.status === "active"
        ? "active"
        : "unsubscribed"
      : "not_subscribed";

    subscriberMap.delete(mergedEmail);

    return {
      email: user.email,
      username: user.username,
      name: subscriber?.name || user.username,
      phone: subscriber?.phone || user.phone || "",
      accountStatus: "registered",
      subscriptionStatus,
      preferredChannels: subscriber?.preferredChannels || [],
      source: subscriber?.source || "",
      registeredAt: user.createdAt,
      subscribedAt: subscriber?.lastSubscribedAt || null,
      unsubscribedAt: subscriber?.unsubscribedAt || null,
      subscriberId: subscriber?._id || null,
      userId: user._id,
      isRegisteredUser: true,
      isSubscriber: Boolean(subscriber),
    };
  });

  const publicOnlyRows = Array.from(subscriberMap.values()).map((subscriber) => ({
    email: subscriber.email,
    username: "",
    name: subscriber.name || "",
    phone: subscriber.phone || "",
    accountStatus: "public_only",
    subscriptionStatus: subscriber.status === "active" ? "active" : "unsubscribed",
    preferredChannels: subscriber.preferredChannels || [],
    source: subscriber.source || "",
    registeredAt: null,
    subscribedAt: subscriber.lastSubscribedAt || subscriber.createdAt || null,
    unsubscribedAt: subscriber.unsubscribedAt || null,
    subscriberId: subscriber._id,
    userId: null,
    isRegisteredUser: false,
    isSubscriber: true,
  }));

  const overviewRows = [...registeredRows, ...publicOnlyRows].filter((row) => {
    if (status === "all") return true;
    if (status === "registered") return row.accountStatus === "registered";
    if (status === "public_only") return row.accountStatus === "public_only";
    return row.subscriptionStatus === status;
  });

  res.status(200).json(
    overviewRows.sort((a, b) => {
      const aDate = new Date(a.registeredAt || a.subscribedAt || 0).getTime();
      const bDate = new Date(b.registeredAt || b.subscribedAt || 0).getTime();
      return bDate - aDate;
    })
  );
});
