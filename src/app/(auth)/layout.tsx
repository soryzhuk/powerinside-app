import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          Power<span className="text-primary">Inside</span>
        </span>
      </Link>

      {children}
    </div>
  );
}
