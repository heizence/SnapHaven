  interface PageProps {
    params: { key: string }; // The dynamic route parameter
  }
  
  export default function Page({ params }: PageProps) {
    return (
      <div>
        <h1>about key param: {params.key}</h1>
      </div>
    );
  }
  