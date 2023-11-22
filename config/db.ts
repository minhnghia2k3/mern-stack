import { ConnectOptions } from "mongodb";
import mongoose from "mongoose";

export const connectDB = () => {
  // !: non-null assertion operator
  mongoose
    .connect(process.env.MONGO_URI as string, {
      retryWrites: true,
      w: "majority",
    })
    .then(() => {
      console.log("Connected to MongoDB.");
    })
    .catch((error) => {
      console.log("Error when connect to db", error);
    });
};
