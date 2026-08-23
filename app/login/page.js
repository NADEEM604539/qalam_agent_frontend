"use client";

import { useState } from "react";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }

      const response = await fetch(`${backendUrl}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: login,
          password: password,
        }),
      });
      setInterval(() => {
      }, 10000);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.message || "Invalid username or password"
        );
      }

      if (!data?.access_token) {
        throw new Error("Access token was not returned by the server");
      }

      localStorage.setItem("access_token", data.access_token);

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="w-full min-h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat font-sans"
      style={{
        backgroundImage: "url('/background.jpg')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative max-w-lg w-full px-4">
        <div className="leading-loose">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto p-10 bg-slate-600/90 shadow-2xl rounded-3xl backdrop-blur-sm"
          >
            {/* Qalam Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/qalam.svg"
                alt="Qalam"
                className="mx-auto max-h-20 w-auto"
              />
            </div>

            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-8 text-gray-700">
                {/* Username */}
                <div className="relative">
                  <input
                    autoComplete="username"
                    name="login"
                    id="login"
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="peer bg-transparent placeholder-transparent rounded caret-white h-10 w-full border-b-2 border-slate-400 transition-colors focus:border-slate-100 text-white focus:outline-none"
                    placeholder="Username"
                    required
                  />

                  <label
                    htmlFor="login"
                    className="absolute left-0 -top-5 text-slate-300 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-2 transition-all peer-focus:-top-5 peer-focus:text-white peer-focus:text-sm"
                  >
                    Username
                  </label>
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    autoComplete="current-password"
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer bg-transparent caret-white placeholder-transparent h-10 w-full border-b-2 border-slate-400 transition-colors focus:border-slate-100 text-white focus:outline-none"
                    placeholder="Password"
                    required
                  />

                  <label
                    htmlFor="password"
                    className="absolute left-0 -top-5 text-slate-300 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-2 transition-all peer-focus:-top-5 peer-focus:text-white peer-focus:text-sm"
                  >
                    Password
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-center text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <div className="relative">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative rounded px-5 py-2.5 overflow-hidden group bg-gray-900 hover:bg-gradient-to-r hover:from-gray-900 hover:to-gray-800 text-white hover:ring-2 hover:ring-offset-2 hover:ring-gray-800 transition-all ease-out duration-300 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-80 bg-white opacity-10 rotate-12 group-hover:-translate-x-80 ease rounded" />

                    <span className="relative font-light tracking-wider">
                      {loading ? "Logging in..." : "Login"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="-mt-3 text-white text-center text-xs font-light tracking-wider">
              Developed by ICT Dte
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}