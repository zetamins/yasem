import { notFound } from "next/navigation";
import { getProfileById, getProfileConfig } from "@/lib/profileStore";
import ProfileConfigPage from "@/components/ProfileConfigPage";

type Props = { params: Promise<{ id: string }> };

export default async function ProfileConfig({ params }: Props) {
  const { id } = await params;
  const profile = getProfileById(id);

  if (!profile) {
    notFound();
  }

  const config = getProfileConfig(profile, profile.classId);

  return (
    <ProfileConfigPage
      profileId={profile.id}
      profileName={profile.name}
      config={config}
    />
  );
}
