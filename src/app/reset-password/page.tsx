"use client";

import { checkResetPasswordInfoAPI } from "@/lib/APIs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [message, setMessage] = useState("");

  const params = useSearchParams();
  const email = params?.get("email") || "";
  const token = params?.get("token") || "";

  useEffect(() => {
    checkParams();
  }, []);

  const checkParams = async () => {
    const res = await checkResetPasswordInfoAPI({ email, token });
    console.log("res : ", res);
    if (res.code === 200) {
      setMessage(`새 비밀번호 : ${res.data.newPassword}`);
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div>
      <span>{message}</span>
    </div>
  );
}
