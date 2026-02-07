// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name required"],
      trim: true,
      maxlength: [50, "Name too long"]
    },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Enter valid email"]
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password required"],
      minlength: [6, "Password too short"],
      select: false 
    },
    dept: {
      type: String,
      required: [true, "Department required"],
      uppercase: true,
      trim: true,
      enum: ["CSE", "ECE", "CE", "CIVIL", "ME", "MECHANICAL", "AI", "EE", "BS", "BASIC SCIENCES"]
    },
    semester: String,
    year: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th"],
      required: function () {
        return this.role === "student";
      }
    },
    enrollmentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      maxlength: [10, "Roll number must be ≤10 characters"],
      match: [/^[A-Z0-9]{6,10}$/, "6-10 uppercase letters + numbers (e.g. CSE301234)"]
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: null
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [50],
      required: function () {
        return this.role === "faculty";
      }
    },
    permissions: [
      {
        type: String,
        enum: ["manage_users", "manage_events", "view_reports"]
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --- INDEXES ---
userSchema.index({ dept: 1, year: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });

// --- MIDDLEWARE ---

/**
 * ✅ FIXED PRE-SAVE HOOK
 * Removed 'next' parameter to resolve "next is not a function" error in async context.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; 
  }
});

/**
 * ✅ FIXED UPDATE HOOK
 */
userSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      throw error;
    }
  }
});

// --- METHODS ---

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; 
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toAuthJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    dept: this.dept,
    year: this.year,
    semester: this.semester,
    enrollmentId: this.enrollmentId,
    rollNumber: this.rollNumber,
    phone: this.phone,
    designation: this.designation,
    isActive: this.isActive,
    profileImage: this.profileImage
  };
};

// --- STATICS ---

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");
  if (!user) return null;

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return null;

  return user;
};

// --- VIRTUALS ---

userSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

userSchema.virtual("isFaculty").get(function () {
  return this.role === "faculty";
});

userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

// --- QUERY HELPERS ---

userSchema.query.active = function () {
  return this.where({ isActive: true });
};

userSchema.query.byDept = function (dept) {
  return this.where({ dept });
};

const User = mongoose.model("User", userSchema);
export default User;