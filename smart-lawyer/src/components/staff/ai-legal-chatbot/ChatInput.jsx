import React from "react";
import PropTypes from "prop-types";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  isLoading,
  onSubmit,
  onKeyDown,
  fileInputRef,
  onFileUpload,
  mode = "conversation",
}) => {
  const isInitial = mode === "initial";
  return (
    <>
      {isInitial && (
        <h1 className="my-8 text-center text-2xl">
          {/* Hello, Hammad. */}
          What can I help with?
        </h1>
      )}
      <div className="rounded-3xl border border-sky-300 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-[13px]">
        <form onSubmit={onSubmit}>
          <div className="flex-1">
            <textarea
              value={inputMessage}
              rows={3}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={"Ask any legal question..."}
              className="w-full bg-transparent focus:outline-none resize-none text-gray-800 placeholder:text-gray-400 text-[13px] leading-relaxed"
            />
          </div>
          <div className="flex justify-between items-end mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="rounded-full py-0.5 px-3 bg-sky-100 hover:cursor-pointer text-sky-400 border-2 border-sky-100 hover:border-2 hover:border-sky-400 transition-colors"
              title="Upload Document"
              aria-label="Upload document"
            >
              <i className="ri-attachment-2" />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
                onChange={onFileUpload}
              />
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="rounded-full text-xs py-1.5 px-3 bg-sky-400 hover:cursor-pointer text-sky-100 border-2 border-sky-400 hover:border-2 hover:border-sky-600 hover:bg-sky-600 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </form>
      </div>
      {isInitial && (
        <div className="my-6 text-center text-[12px] flex justify-center gap-3 flex-wrap">
          <span className="py-1.5 px-3 bg-white text-sky-400  border border-sky-400 rounded-full">
            legal research
          </span>
          <span className="py-1.5 px-3 bg-white text-sky-400  border border-sky-400 rounded-full">
            contract analysis
          </span>
          <span className="py-1.5 px-3 bg-white text-sky-400  border border-sky-400 rounded-full">
            document review
          </span>
        </div>
      )}
      {!isInitial && (
        <p className="text-xs text-center text-gray-400 mt-3 ">
          Model is fragile. So, it can make mistakes.
        </p>
      )}
    </>
  );
};

ChatInput.propTypes = {
  inputMessage: PropTypes.string.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  mode: PropTypes.string,
};

export default ChatInput;
