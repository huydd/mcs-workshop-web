"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#212121] mb-2">
          Đã xảy ra lỗi
        </h1>
        <p className="text-[#616161] mb-6">
          Xin lỗi, đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ
          bộ phận kỹ thuật.
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-left">
            <p className="text-xs text-gray-600 font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  );
}
