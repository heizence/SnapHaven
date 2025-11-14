import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  type: string;
  label?: string;
  placeholder: string;
  value: string;
  showPassword?: boolean; // 비밀번호 표시 여부(비밀번호 입력창일 때만 사용)
  errorMessage: string;
  onChange: (e: any) => void;
  togglePasswordVisibility?: () => void; // 비밀번호 표시 여부 토글 함수(비밀번호 입력창일 때만 사용)
}

export default function Input({
  type,
  label,
  placeholder,
  value,
  showPassword,
  errorMessage,
  onChange,
  togglePasswordVisibility,
}: InputProps) {
  let typeToApply = type;

  // 비밀번호 입력창일 경우 비밀번호 보이기/가리기 설정
  if (typeToApply === "password") {
    if (showPassword) typeToApply = "text";
    else typeToApply = "password";
  }

  return (
    <>
      <label className="flex flex-col">
        <p className="pb-2 text-sm font-medium leading-normal text-slate-700">{label}</p>
        <div className="relative w-full">
          <input
            type={typeToApply}
            placeholder={placeholder}
            className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border p-3 text-base font-normal placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                  ${
                    errorMessage
                      ? "border-red-500 focus:ring-red-500/20" // 에러
                      : "border-slate-300 bg-white text-slate-900" // 기본
                  }`}
            value={value}
            onChange={onChange}
          />
          {/* 비밀번호 보여주기 토글 버튼 */}
          {type === "password" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {errorMessage && <p className="text-red-500 text-sm mt-1">❌ {errorMessage}</p>}
      </label>
    </>
  );
}
