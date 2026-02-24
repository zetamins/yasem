import Image from "next/image";
import styles from "./ProfileCard.module.css";

interface ProfileInfo {
  id: string;
  name: string;
  classId: string;
  submodel: string;
  url: string;
  image: string;
}

interface Props {
  profile: ProfileInfo;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export default function ProfileCard({ profile, selected, onClick, onMouseEnter }: Props) {
  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      title={profile.url || profile.name}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={profile.image || "/img/mag-generic.png"}
          alt={profile.submodel}
          width={160}
          height={120}
          className={styles.image}
          onError={() => {}}
          unoptimized
        />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{profile.name}</div>
        <div className={styles.submodel}>{profile.submodel}</div>
        {profile.url && (
          <div className={styles.url}>{profile.url}</div>
        )}
      </div>
    </button>
  );
}
