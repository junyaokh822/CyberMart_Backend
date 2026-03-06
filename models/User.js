import mongoose from "mongoose";

/**
 * User Schema
 * Represents a registered user in the system.
 * Roles: "customer" (default) or "admin"
 * Email is unique and lowercased for consistent lookups.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // enforced by MongoDB index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  },
);

// Index for filtering users by role (e.g. admin dashboard queries)
userSchema.index({ role: 1 });

/**
 * toJSON transform
 * Automatically strips the password field whenever a User document
 * is serialized to JSON (e.g. in API responses), preventing accidental exposure.
 */
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);
export default User;
