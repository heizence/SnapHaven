"use client";

import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold mb-4">Reset Password</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {`Enter your email, and we'll send you a new password.`}
        </p>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="name@email.com"
            className="w-full p-1 border border-1px border-solid rounded-sm"
          />
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">
          <a href="/login" className="hover:underline">
            Remember your password?
          </a>
        </div>

        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
          Send new password
        </Button>
      </div>
    </div>
  );
}
