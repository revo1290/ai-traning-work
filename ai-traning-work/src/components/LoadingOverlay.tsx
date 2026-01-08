"use client";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({ isLoading, message = "処理中..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[var(--border-color)] rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
        {/* Message */}
        <p className="text-[var(--text-primary)] font-medium">{message}</p>
        <p className="text-[var(--text-muted)] text-sm">しばらくお待ちください</p>
      </div>
    </div>
  );
}
