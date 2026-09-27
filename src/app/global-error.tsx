"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>エラーが発生しました</h2>
          <p>申し訳ありません。予期しないエラーが発生しました。</p>
          <button onClick={() => reset()} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
