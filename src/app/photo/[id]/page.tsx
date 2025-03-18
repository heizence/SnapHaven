import PhotoRenderer from "@/components/PhotoRenderer";

interface PageProps {
  params: { id: string }; // The dynamic route parameter
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mt-5 mb-5">
      <PhotoRenderer id={id} />
    </div>
  );
}
