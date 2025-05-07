"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);

    await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    setCaption("");
    setImage(null);
    fetchPosts();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>

      <div>
        {posts.map((post) => (
          <div key={post._id}>
            <img src={post.imageUrl} alt="post" width="300" />
            <p>{post.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

