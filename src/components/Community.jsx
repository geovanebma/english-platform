tsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Send,
  MessageSquare,
  Heart,
  User,
  Loader2,
  Plus,
  ThumbsUp,
} from "lucide-react";

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock fetch
  useEffect(() => {
    const mock = [
      {
        id: 1,
        author: "Alice",
        avatar: "https://i.pravatar.cc/40?u=alice",
        content: "Just finished a great lesson on phrasal verbs!",
        likes: 3,
        comments: [{ id: 1, author: "Bob", content: "Nice! Keep it up!" }],
      },
      {
        id: 2,
        author: "Carlos",
        avatar: "https://i.pravatar.cc/40?u=carlos",
        content: "Anyone up for a speaking practice session?",
        likes: 5,
        comments: [],
      },
    ];
    setTimeout(() => {
      setPosts(mock);
      setLoading(false);
    }, 800);
  }, []);

  const handlePost = useCallback(() => {
    if (!newContent.trim()) return;
    const post: Post = {
      id: Date.now(),
      author: "You",
      avatar: "https://i.pravatar.cc/40?u=you",
      content: newContent,
      likes: 0,
      comments: [],
    };
    setPosts((prev) => [post, ...prev]);
    setNewContent("");
    textareaRef.current?.focus();
  }, [newContent]);

  const toggleLike = useCallback((id: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  }, []);

  const addComment = useCallback((postId: number, text: string) => {
    if (!text.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: Date.now(), author: "You", content: text },
              ],
            }
          : p
      )
    );
  }, []);

  return (
    <section className="max-w-2xl mx-auto p-4 space-y-6 text-gray-100">
      {/* New post */}
      <div className="bg-gray-800 rounded-xl p-4 shadow-md">
        <textarea
          ref={textareaRef}
          rows={3}
          className="w-full bg-gray-700 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
          placeholder="Share something with the community..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          aria-label="New post"
        />
        <button
          className="mt-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md transition"
          onClick={handlePost}
          aria-label="Publish post"
        >
          <Send size={18} />
          Post
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-indigo-400" size={32} />
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={toggleLike}
            onComment={addComment}
          />
        ))
      )}
    </section>
  );
}

/* ---------- PostCard ---------- */
const PostCard = memo(function ({
  post,
  onLike,
  onComment,
}: {
  post: Post;
  onLike: (id: number) => void;
  onComment: (postId: number, text: string) => void;
}) {
  return (
    <article className="bg-gray-800 rounded-xl p-4 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src={post.avatar}
          alt={post.author}
          className="w-10 h-10 rounded-full"
        />
        <span className="font-medium">{post.author}</span>
      </div>

      {/* Content */}
      <p className="text-gray-200">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-400">
        <button
          className="flex items-center gap-1 hover:text-indigo-400 transition"
          onClick={() => onLike(post.id)}
          aria-label="Like post"
        >
          <Heart size={18} />
          <span>{post.likes}</span>
        </button>
        <button
          className="flex items-center gap-1 hover:text-indigo-400 transition"
          aria-label="Show comments"
        >
          <MessageSquare size={18} />
          <span>{post.comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-3 space-y-2">
        {post.comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <User size={16} className="text-gray-500 mt-0.5" />
            <div className="bg-gray-700 rounded-md p-2 text-sm text-gray-300">
              <span className="font-medium">{c.author}:</span> {c.content}
            </div>
          </div>
        ))}

        {/* Add comment */}
        <AddCommentForm onSubmit={(txt) => onComment(post.id, txt)} />
      </div>
    </article>
  );
});

/* ---------- AddCommentForm ---------- */
function AddCommentForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(text);
      setText("");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <textarea
        rows={1}
        className="flex-1 bg-gray-700 text-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        aria-label="Add comment"
      />
      <button
        className="p-2 text-indigo-400 hover:text-indigo-300 transition"
        onClick={() => {
          onSubmit(text);
          setText("");
        }}
        aria-label="Send comment"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}

/* ---------- Types ---------- */
type Comment = { id: number; author: string; content: string };
type Post = {
  id: number;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: Comment[];
};