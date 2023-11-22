import mongoose from "mongoose";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { model, Schema, Model, Document } from "mongoose";

// Declare Point type
export interface IPoint extends Document {
  type: string;
  coordinates: string;
}

// Declare user type
export interface IUser extends Document {
  getResetPasswordToken(): string;
  getSignedToken(): string;
  resetPasswordToken: string | undefined;
  resetPasswordExpire: string | undefined;
  matchPassword(password: string): boolean | PromiseLike<boolean>;
  username: string;
  password: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
    bio: string;
    phone: string;
    gender: string;
    address: {
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      location: {
        type: IPoint;
        required: false;
      };
    };
    active: true;
  };
}

// Generate point schema
const Point: Schema = new Schema({
  type: {
    type: String,
    enum: ["Point"], // validator value
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "Can't be blank!"],
    index: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: [8, "Please use minimum of 8 characters"],
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, "Can't be blank!"],
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please use a valid address"],
    unique: true,
    index: true,
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    phone: String,
    gender: String,
    address: {
      street1: String,
      street2: String,
      city: String,
      state: String,
      country: String,
      zip: String,
      location: {
        type: Point,
        required: false,
      },
    },
    active: { type: Boolean, default: true },
  },
  resetPasswordToken: String,
  resetPasswordExpire: String,
});

/*
 *Using pre-save middleware ( execute before save to db )
 *If password be modified -> hash password -> save to db
 */
UserSchema.pre<IUser>("save", async function (next: any) {
  // Check password is modify?
  if (!this.isModified("password")) {
    return next();
  }

  // Encrypt password
  const salt = await bycrypt.genSalt(10);
  this.password = bycrypt.hashSync(this.password, salt);
  next();
});

/** User Schema methods */

UserSchema.methods.matchPassword = async function (password: string) {
  // return <boolean>
  return await bycrypt.compare(password, this.password);
};

UserSchema.methods.getSignedToken = function () {
  // return string of jwt
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.getResetPasswordToken = function () {
  // Generating a random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Creating hash of token
  // Secure hash algorithm 256 bit
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken) // update the hash with resetToken data
    .digest("hex"); // return hexadecimal string

  // Expire 10 mins
  this.resetPasswordExpire = Date.now() + 10 * (60 * 1000);

  return resetToken;
};

export const User: Model<IUser> = model<IUser>("User", UserSchema);
