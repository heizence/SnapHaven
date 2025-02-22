import PhotoRenderer from "@/components/PhotoRenderer";

interface BlogPageProps {
  params: { id: string }; // The dynamic route parameter
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;

  return (
    <div className="mt-5 mb-5">
      <PhotoRenderer id={id} />
    </div>
  );
}
