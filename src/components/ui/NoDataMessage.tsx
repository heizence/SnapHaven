interface Props {
  message: string;
  show: boolean;
}

export default function NoDataMessage({ message, show }: Props) {
  if (!show) return null;
  return (
    <div className={`flex justify-center py-2`}>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
