export function LoadingBubble() {
  return (
    <div className="flex gap-2.5 animate-fadeIn">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-xs shrink-0">
        ⚙
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingBubble;
