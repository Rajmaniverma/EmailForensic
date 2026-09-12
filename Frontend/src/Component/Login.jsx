
import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Backend response:", data);

    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-gray-900">
            Email Forensics
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your account
          </p>

        </div>


        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="
                w-full
                px-4
                py-3
                border
                border-gray-300
                rounded-lg
                outline-none
                transition
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-500
              "
            />
          </div>


          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="
                w-full
                px-4
                py-3
                border
                border-gray-300
                rounded-lg
                outline-none
                transition
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-500
              "
            />
          </div>


          {/* Login Button */}
          <button
            type="submit"
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              py-3
              rounded-lg
              transition
              duration-200
              shadow-md
              hover:shadow-lg
            "
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;

