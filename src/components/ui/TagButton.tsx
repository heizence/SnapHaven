interface TagButtonProps {
  name: string;
}

export function TagButton({ name }: TagButtonProps) {
  return (
    <span
      key={name}
      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600"
    >
      #{name}
    </span>
  );
}

interface TagButtonsProps {
  tagsArray: string[];
}

export function TagButtons({ tagsArray }: TagButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tagsArray.map((tag) => (
        <TagButton key={tag} name={tag} />
      ))}
    </div>
  );
}
