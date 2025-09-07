"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { registerUser } from "@/utils/auth"; // tumhari API call

const checkPasswordStrength = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength =
    (hasUpperCase ? 1 : 0) +
    (hasLowerCase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecialChar ? 1 : 0);

  return strength;
};

const Register = () => {
  const [step, setStep] = useState("register"); // register | otp
  const [loading, setLoading] = useState(false);
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const toggleConfirmPassword = () => {
    setConfirmPasswordType(
      confirmPasswordType === "password" ? "text" : "password"
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordStrength < 3) {
      toast.error("Password is too weak");
      return;
    }

    try {
      setLoading(true);
      // API call: sirf name, email, password
      await registerUser(formData.name, formData.email, formData.password);
      setLoading(false);
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // API call for OTP verify
      // await verifyOtp(formData.email, formData.otp);
      setLoading(false);
      toast.success("Account created successfully!");
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background Effects */}
      <div className="bg-grid"></div>
      <div className="bg-spotlights"></div>
      <div className="bg-noise"></div>

      {/* Glass Card */}
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        {step === "register" && (
          <>
            <h2 className="text-3xl font-bold text-center mb-2">
              Create Account ✨
            </h2>
            <p className="text-center text-gray-400 mb-6">
              Sign up to start your journey
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border px-4 py-2 bg-transparent backdrop-blur-md outline-none focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border px-4 py-2 bg-transparent outline-none focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                  <input
                    type={passwordType}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border px-4 py-2 bg-transparent outline-none focus:border-blue-500"
                    placeholder="Enter password"
                  />
                  <span
                    className="absolute right-3 top-2.5 cursor-pointer text-gray-400"
                    onClick={togglePassword}
                  >
                    {passwordType === "password" ? (
                      <HiEyeSlash size={20} />
                    ) : (
                      <HiEye size={20} />
                    )}
                  </span>
                </div>

                {/* Strength Meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-2 w-full bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === 1
                            ? "bg-red-500 w-1/4"
                            : passwordStrength === 2
                            ? "bg-orange-500 w-2/4"
                            : passwordStrength === 3
                            ? "bg-yellow-500 w-3/4"
                            : passwordStrength === 4
                            ? "bg-green-500 w-full"
                            : "w-0"
                        }`}
                      ></div>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        passwordStrength <= 1
                          ? "text-red-400"
                          : passwordStrength === 2
                          ? "text-orange-400"
                          : passwordStrength === 3
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {passwordStrength <= 1
                        ? "Weak"
                        : passwordStrength === 2
                        ? "Normal"
                        : passwordStrength === 3
                        ? "Strong"
                        : "Very Strong"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={confirmPasswordType}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border px-4 py-2 bg-transparent outline-none focus:border-blue-500"
                    placeholder="Re-enter password"
                  />
                  <span
                    className="absolute right-3 top-2.5 cursor-pointer text-gray-400"
                    onClick={toggleConfirmPassword}
                  >
                    {confirmPasswordType === "password" ? (
                      <HiEyeSlash size={20} />
                    ) : (
                      <HiEye size={20} />
                    )}
                  </span>
                </div>
                {formData.confirmPassword &&
                  formData.confirmPassword !== formData.password && (
                    <p className="text-xs text-red-400 mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Register"}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          </>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <>
            <h2 className="text-3xl font-bold text-center mb-2">Verify OTP 🔑</h2>
            <p className="text-center text-gray-400 mb-6">
              Enter the OTP sent to <b>{formData.email}</b>
            </p>

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border px-4 py-2 bg-transparent outline-none focus:border-blue-500"
                  placeholder="Enter OTP"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
