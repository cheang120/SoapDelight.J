import asyncHandler from "express-async-handler";
import Transaction from "../models/transactionModel.js";
import {stripe}  from "../utils/index.js";
import axios from "axios";
import User from "../models/user.model.js";
import Stripe from "stripe";



// Transfer Funds
export const transferFund = asyncHandler(async (req, res) => {
    // res.send("Correct")
  // Validation

  const { amount, sender, receiver, description, status } = req.body;
  if (!amount || !sender || !receiver) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }
//   // Check Sender's account balance
  const user = await User.findOne({ email: sender });
  if (user.balance < amount) {
    res.status(400);
    throw new Error("Insufficient balance");
  }

//   // save the transaction
  await Transaction.create(req.body);

//   // decrease the sender's balance
  await User.findOneAndUpdate(
    { email: sender },
    {
      $inc: { balance: -amount },
    }
  );

//   // increase the receiver's balance
  await User.findOneAndUpdate(
    { email: receiver },
    {
      $inc: { balance: amount },
    }
  );

  res.status(200).json({ message: "Transaction successful" });
});

// verify Account
export const verifyAccount = asyncHandler(async (req, res) => {
    // res.send("Correct")

  const user = await User.findOne({ email: req.body.receiver });
  if (!user) {
    res.status(404);
    throw new Error("User Account not found");
  }
  res.status(200).json({ message: "Account Verification Successful" });
});

// getUserTransactions
export const getUserTransactions = asyncHandler(async (req, res) => {
        // res.send("Correct")
    if (req.user.email !== req.body.email) {
        res.status(400)
        throw new Error("Not authorized to view transaction.")
    }

  const transactions = await Transaction.find({
    $or: [{ sender: req.body.email }, { receiver: req.body.email }],
  })
    .sort({ createdAt: -1 })
    .populate("sender")
    .populate("receiver");

  res.status(200).json(transactions);
});

// Deposit Funds With Stripe
export const depositFundStripe = asyncHandler(async (req, res) => {
    // res.send("correct")

  const { amount } = req.body;
  console.log(amount);
  const user = await User.findById(req.user._id);

  // Create stripe customer
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email });
    user.stripeCustomerId = customer.id;
    user.save();
  }

  // Create Stripe Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "hkd",
          product_data: {
            name: "SoapDelight.J Wallet Deposit",
            description: `Make a deposit of $${amount} to SoapDelight.J wallet`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    customer: user.stripeCustomerId,
    success_url:
      import.meta.env.FRONTEND_URL + `/wallet?payment=successful&amount=${amount}`,
    cancel_url: import.meta.env.FRONTEND_URL + "/wallet?payment=failed",
  });

  // console.log(session);
//   console.log(session.amount_total);

  return res.json(session);
});

// Deposit Fund Stripe
export const depositFund = async (customer, data, description, source) => {
  await Transaction.create({
    amount:
      source === "stripe" ? data.amount_subtotal / 100 : data.amount_subtotal,
    sender: "Self",
    receiver: customer.email,
    description: description,
    status: "success",
  });

  // increase the receiver's balance
  await User.findOneAndUpdate(
    { email: customer.email },
    {
      $inc: {
        balance:
          source === "stripe"
            ? data.amount_subtotal / 100
            : data.amount_subtotal,
      },
    }
  );
};

// stripe webhook
// const endpointSecret =
//   "whsec_c22fcc4d163d10c1cdcaa13c55aa2cec4ad64c5279e7631856ec96852e6d9d5a";
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

export const webhook = asyncHandler(async (req, res) => {
    // res.send("Correct")
//   console.log("Webhook start");
  const sig = req.headers["stripe-signature"];

  let event;
  let data;
  let eventType;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook verified");
  } catch (err) {
    console.log("Webhook error", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  data = event.data.object;
  eventType = event.type;

  // Handle the event
  if (eventType === "checkout.session.completed") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        console.log(customer.email);
        console.log("data:", data.amount_total);
        const description = "Stripe Deposit";
        const source = "stripe";
        // save the transaction
        try {
          depositFund(customer, data, description, source);
        } catch (error) {
          console.log(err);
        }
      })
      .catch((err) => console.log(err.message));
  }

  res.send().end();
});

// Deposit Fund FLW
export const depositFundFLW = asyncHandler(async (req, res) => {
    res.send("correct")
//   const { transaction_id } = req.query;

//   // Confirm transaction
//   const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

//   const response = await axios({
//     url,
//     method: "get",
//     headers: {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       Authorization: process.env.FLW_SECRET_KEY,
//     },
//   });

//   // console.log(response.data.data);
//   const { amount, customer, tx_ref } = response.data.data;
//   // console.log(amount);
//   // console.log(typeof amount);
//   // console.log(customer);

//   const successURL = process.env.FRONTEND_URL + "/wallet?payment=successful";
//   const failureURL = process.env.FRONTEND_URL + "/wallet?payment=failed";
//   if (req.query.status === "successful") {
//     const data = {
//       amount_subtotal: amount,
//     };
//     const description = "Flutterwave Deposit";
//     const source = "flutterwave";
//     depositFund(customer, data, description, source);
//     res.redirect(successURL);
//   } else {
//     res.redirect(failureURL);
//   }
});

// module.exports = {
//   transferFund,
//   verifyAccount,
//   getUserTransactions,
//   depositFundStripe,
//   webhook,
//   depositFundFLW,
// };
