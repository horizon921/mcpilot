import Image from "next/image";

export default function MainPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary">
          Welcome to MCPilot!
        </h1>

        <p className="mt-3 text-xl sm:text-2xl text-foreground-light dark:text-foreground-dark">
          Your AI Assistant with MCP Support is getting ready.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-around max-w-4xl sm:w-full">
          {/* Placeholder for future content or navigation */}
        </div>
      </main>
    </div>
  );
}