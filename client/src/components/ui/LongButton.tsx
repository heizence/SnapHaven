interface LongButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function LongButton({ title, onClick, disabled }: LongButtonProps) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-3 
      rounded-lg border bg-blue-500 px-4 py-2 
      text-[15px] font-medium text-white shadow-sm 
      transition-colors 
      hover:bg-blue-800 
      disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
    >
      {title}
    </button>
  );
}
