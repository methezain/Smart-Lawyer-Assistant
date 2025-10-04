import React from "react";

// Dummy review data for demonstration
const reviews = [
  {
    id: 1,
    rating: 3,
    title: "Not bad. But something's different.",
    text: "I bought a a Adidas star wars trainers and thought it's a big brand but after wearing it, it's not as comfortable as I thought it was, is it a degrade of the materials they used?",
    user: {
      name: "Hannah Rogers",
      avatar: "/user1.jpg", // Replace with actual avatar path or leave blank for fallback
      reviews: 1,
    },
    date: "2 days ago",
  },
];

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-2.5 h-2.5 rounded ${
            i < rating ? "bg-yellow-400" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function ClientReviews({ onCountChange }) {
  const [expanded, setExpanded] = React.useState({});
  React.useEffect(() => {
    if (typeof onCountChange === "function") onCountChange(reviews.length);
  }, [onCountChange]);

  const MAX_CHARS = 120;

  const handleToggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="space-y-6">
        {reviews.map((review) => {
          const isLong = review.text.length > MAX_CHARS;
          const isExpanded = expanded[review.id];
          const displayText =
            isExpanded || !isLong
              ? review.text
              : review.text.slice(0, MAX_CHARS) + "...";
          return (
            <div key={review.id}>
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={review.user.avatar || "/user.svg"}
                  alt={review.user.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={(e) => (e.currentTarget.src = "/user.svg")}
                />
                <div className="space-y-1">
                  <div className="font-semibold text-xs text-gray-900 leading-tight flex items-center gap-1">
                    {review.user.name}{" "}
                    <span className="w-1 h-1 bg-gray-700 rounded"></span>
                    <span className="text-gray-500 text-[10px]">
                      {review.date}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
              </div>

              <div className="font-semibold text-gray-900 my-1 text-xs">
                {review.title}
              </div>
              <div className="text-gray-700 text-xs">{displayText}</div>
              <div className="relative">
                {isLong && (
                  <button
                    className="text-emerald-600 hover:text-emerald-700 text-[11px] font-medium focus:outline-none absolute top-0 cursor-pointer"
                    onClick={() => handleToggle(review.id)}
                    type="button"
                  >
                    {isExpanded ? "View less" : "View more"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
