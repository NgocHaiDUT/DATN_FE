"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { UserProfile } from "@/components/pages/user/UserProfile";

export default function Page() {
  const params = useParams<{ slug: string }>();
  const id = useMemo(() => {
    if (!params?.slug) return null;
    const num = Number(params.slug);
    return Number.isNaN(num) ? null : num;
  }, [params?.slug]);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">User id không hợp lệ.</p>
      </div>
    );
  }

  return <UserProfile userId={id} />;
}

