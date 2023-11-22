import { Request, Response, NextFunction } from "express";
import { IUser, User } from "../models/user";
import crypto from "crypto";
import { sendEmail } from "../utils/emailSender";
import { ErrorResponse } from "../utils/errorResponse";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, email, password } = req.body;
  try {
    const user: IUser = await User.create({
      username,
      email,
      password,
    });

    return res.status(200).json({ user });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new ErrorResponse("Please provide a valid email and password", 400)
    );
  }

  try {
    const user: IUser = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }
    const isMatch = await user.matchPassword(password);
    console.log("ismatch? ", isMatch);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  try {
    const user: IUser | null = await User.findOne({ email: email });

    if (!user) {
      return next(new ErrorResponse("User not found!", 404));
    }

    // sign resetPasswordToken & passwordTokenExpired to user
    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `http://localhost:5000/api/auth/resetpassword/${resetToken}`;

    const message = `
        <h1> You have requested a password reset </h1>
        <p> Please go to this link to reset your password </p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a> 
        `;

    try {
      await sendEmail({
        to: user.email,
        text: message,
        subject: `Reset password user ${user.username}`,
      });

      res.status(200).json({
        success: true,
        data: "Email sent",
      });
    } catch (error: any) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error: any) {
    return res.status(500).json({ error });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body;
  console.log("req.params.resetToken", req.params.resetToken);
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user: IUser | null = await User.findOne({
      resetPasswordToken,
      // $gt: greater than
      resetPasswordExpire: { $gt: Date.now() },
    });
    console.log("user: ", user);
    if (!user) {
      return next(new ErrorResponse("Invalid reset token", 400));
    }

    user.password = password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    await user.save();

    return res.status(201).json({
      success: true,
      data: "Password reset successfully",
    });
  } catch (err: any) {
    return res.status(500).json(err);
  }
};
