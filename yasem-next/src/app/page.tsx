import { Suspense } from "react";
import ProfilesPage from "@/components/ProfilesPage";

export default function Home() {
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>
      <ProfilesPage />
    </Suspense>
  );
}
