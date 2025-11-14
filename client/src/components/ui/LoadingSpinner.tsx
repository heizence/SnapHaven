interface Props {
  isLoading: boolean;
}

export default function LoadingSpinner({ isLoading }: Props) {
  if (!isLoading) return null;
  return (
    <div className="flex justify-center mt-[30vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
  );
}
