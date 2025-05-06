"use client";
import { useState } from "react";

export default function Home() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);

    await fetch("/api/posts", {
      method: "POST",
      body: formData
    });

    alert("Post uploaded!");
  };

  return (
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
  );
}
