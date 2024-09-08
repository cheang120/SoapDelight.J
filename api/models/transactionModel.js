import  mongoose from "mongoose";

const transactionSchema = mongoose.Schema(
    {
      amount: {
        type: Number,
        required: true,
      },
      sender: {
        type: String,
        required: true,
        //   ref: "User",
      },
      receiver: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );
  
  const Transaction = mongoose.model("Transactions", transactionSchema);
  export default Transaction;