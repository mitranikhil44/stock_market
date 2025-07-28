"use client";

import { useState } from "react";
// import { SuccessToast, ErrorToast } from "@/components/other/CustomToasts";

const checkFormFilleds = async (name, email, password) => {
  if (!email || !name || !password) {
    let message = "Please fill in";
    if (!email) message += " your email address,";
    if (!name) message += " your name,";
    if (!password) message += " your password,";
    message = message.slice(0, -1) + ".";
    // setErrorToastMessage(message);
    // setShowErrorToaster(true);
    return false;
  }
  return true;
};

const registerUser = async (name, email, password) => {
  localStorage.clear();
  let role = "user";
  const response = await fetch("/api/auth/sign_up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
    return "/";
  } else {
    throw new Error(data.error);
  }
};

const loginUser = async (email, password) => {
  localStorage.clear();
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
    return "/";
  } else {
    throw new Error(data.error);
  }
};

const logoutUser = () => {
  localStorage.removeItem("token");
};

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const setToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export {
  checkFormFilleds,
  registerUser,
  loginUser,
  logoutUser,
  getToken,
  setToken,
  removeToken,
};
