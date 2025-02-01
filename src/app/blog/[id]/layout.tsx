interface post {
   title: string,
    author: string
  }
  
async function fetchPostData(id: string) : Promise<post> {
    // Simulate fetching data from an API
    const posts = {
      "1": { title: "First Post", author: "John Doe" },
      "2": { title: "Second Post", author: "Jane Smith" },
    };
    return posts[id] || { title: "Post Not Found", author: "Unknown" };
  }
  
  interface BlogLayoutProps {
    children: React.ReactNode;
    params: { id: string };
  }
  
  export default async function BlogLayout({ children, params }: BlogLayoutProps) {
    const postData = await fetchPostData(params.id);
  
    return (
      <div>
        <header style={{ background: "#333", color: "#fff", padding: "1rem" }}>
          <h1>{postData.title}</h1>
          <p>By {postData.author}</p>
        </header>
        <main>{children}</main>
      </div>
    );
  }
  