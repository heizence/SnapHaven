"use client";

import React from "react";

// 부모 컴포넌트로부터 받을 props의 타입을 정의합니다.
// checked: 현재 체크 상태
// onChange: 상태가 변경될 때 호출될 함수
interface CheckboxProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label = "", // 기본 라벨 텍스트 설정
  disabled = false,
}) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(event.target.checked);
  };

  // 비활성화 상태에 따른 동적 스타일 클래스
  const containerClasses = `flex items-center ${
    disabled ? "cursor-not-allowed" : "cursor-pointer"
  }`;
  // FIX: 라벨에 select-none 클래스 추가
  const labelClasses = `ml-3 text-md font-medium select-none ${
    disabled ? "text-gray-400" : "text-gray-800"
  }`;

  return (
    <div className={containerClasses}>
      <input
        id="upload-as-group"
        type="checkbox"
        checked={checked}
        onChange={handleCheckboxChange}
        disabled={disabled} // input 요소에 disabled 속성 전달
        className={`
          h-5 w-5
          rounded-md
          border-gray-300
          text-blue-600
          focus:ring-2
          focus:ring-blue-500
          ${disabled ? "bg-gray-200 cursor-not-allowed" : "cursor-pointer"}
        `}
      />
      <label htmlFor="upload-as-group" className={labelClasses}>
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
