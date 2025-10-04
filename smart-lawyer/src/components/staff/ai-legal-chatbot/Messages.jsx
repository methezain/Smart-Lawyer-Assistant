import React from "react";
import PropTypes from "prop-types";

// Helper to compute styling based on message attributes
function computeClasses(message) {
  if (message.sender === "user") {
    return {
      container: "justify-end",
      bubble: "bg-emerald-600 text-white rounded-xl rounded-tr-sm shadow-sm",
      timestamp: "text-emerald-100",
      showAvatar: false,
    };
  }
  if (message.isError) {
    return {
      container: "justify-start",
      bubble:
        "bg-red-50 text-red-800 border border-red-200 rounded-xl rounded-tl-sm",
      timestamp: "text-red-500",
      showAvatar: true,
    };
  }
  return {
    container: "justify-start",
    bubble:
      "bg-white text-gray-800 border border-gray-200 rounded-xl rounded-tl-sm shadow-sm",
    timestamp: "text-gray-500",
    showAvatar: true,
  };
}

const AssistantAvatar = () => <i className="ri-sparkling-2-line text-lg" />;

const SourceCard = ({ filename, score }) => (
  <div className="text-xs bg-gray-50 border border-gray-200 p-2 rounded-lg">
    <div className="font-medium line-clamp-1">{filename}</div>
    <div className="text-gray-500">Score: {score.toFixed(3)}</div>
  </div>
);

SourceCard.propTypes = {
  filename: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
};

const Messages = ({ messages, isLoading, endRef, formatTimestamp }) => {
  if (messages.length === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl" aria-live="polite">
      {messages.map((message) => {
        const { container, bubble, timestamp, showAvatar } =
          computeClasses(message);
        return (
          <div
            key={message.id}
            className={`flex ${container} gap-2 animate-fadeIn`}
          >
            {showAvatar && <AssistantAvatar />}
            <div className={`px-2 py-1 ${bubble}`}>
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
                {message.content}
              </div>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Sources
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {message.sources.map((s) => (
                      <SourceCard
                        key={`${s.filename}-${s.score}`}
                        filename={s.filename}
                        score={s.score}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className={`text-[9px] ${timestamp}`}>
                {formatTimestamp(message.timestamp)}
                {message.response_type && (
                  <span className="ml-1">· {message.response_type}</span>
                )}
                {message.context_used && (
                  <span className="ml-1">· {message.context_used} docs</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 rounded-bl-none">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-0" />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-150" />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce delay-300" />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};

Messages.propTypes = {
  messages: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  endRef: PropTypes.object.isRequired,
  formatTimestamp: PropTypes.func.isRequired,
};

export default Messages;
