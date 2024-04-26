"use client";
import React, { useState, useRef } from "react";
import axios from "axios";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      console.log(email, password);
      const response = await axios.post("http://localhost:8000/auth/login", {
        email,
        Password: password,
      });
      console.log(response.data, "login");
      const accessToken = response.data; // Assuming access_token is in response data
      const accessTokenString = JSON.stringify(accessToken);

      localStorage.setItem("access_token", accessTokenString);
      window.location.href = "/"; // Redirect to homepage
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="container mx-auto max-w-sm p-4">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-bold text-center">Login</h1>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            type="text"
            id="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          Login
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
};

export default LoginForm;
