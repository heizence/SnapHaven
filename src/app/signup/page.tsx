"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold mb-4">Sign up</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="name@email.com"
            className="w-full p-1 border border-1px border-solid rounded-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-1 pr-10 border border-1px border-solid rounded-sm"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full p-1 pr-10 border border-1px border-solid rounded-sm"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">
          <a href="/login" className="hover:underline">
            Already have an account?
          </a>
        </div>

        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">Sign Up</Button>
      </div>
    </div>
  );
}
