interface BlogPageProps {
    params: { id: string }; // The dynamic route parameter
  }
  
  export default function BlogPage({ params }: BlogPageProps) {
    return (
      <div>
        <h1>Blog Post: {params.id}</h1>
        <p>This is the content of blog post with ID: {params.id}.</p>
      </div>
    );
  }
  