import { notFound } from "next/navigation";
import { getProfileById } from "@/lib/profileStore";
import PortalViewer from "@/components/PortalViewer";

type Props = { params: Promise<{ profileId: string }> };

export default async function PortalPage({ params }: Props) {
  const { profileId } = await params;
  const profile = getProfileById(profileId);

  if (!profile) {
    notFound();
  }

  const aspectRatio = profile.config["media/aspect_ratio"] || "auto";

  return (
    <PortalViewer
      profileId={profile.id}
      profileName={profile.name}
      portalUrl={profile.portal}
      classId={profile.classId}
      submodel={profile.submodel}
      aspectRatio={aspectRatio}
    />
  );
}
