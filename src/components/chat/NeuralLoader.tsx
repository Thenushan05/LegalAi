import { useEffect, useState } from "react";

export function NeuralLoader() {
  const messages = [
    "Thinking...",
    "Scanning document...",
    "Highlighting key points...",
    "Analyzing content...",
    "Extracting insights...",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000); // change word every 2s
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-3">
      {/* bouncing dots */}
      <div className="flex space-x-2">
        <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-0"></span>
        <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></span>
        <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300"></span>
      </div>

      {/* dynamic loading text */}
      <p className="text-blue-600 font-medium text-sm transition-opacity duration-500">
        {messages[index]}
      </p>
    </div>
  );
}
