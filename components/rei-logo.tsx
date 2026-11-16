import Image from "next/image";

type ReiLogoProps = {
  compact?: boolean;
  className?: string;
};

export default function ReiLogo({ compact = false, className = "" }: ReiLogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        textAlign: "center",
      }}
    >
      <Image
        src="https://rajaemasindonesia.co.id/wp-content/uploads/2025/01/2-Photoroom.png"
        alt="Logo Raja Emas Indonesia"
        width={compact ? 64 : 100}
        height={compact ? 64 : 100}
        priority
        style={{
          display: "block",
          width: compact ? "64px" : "100px",
          height: compact ? "64px" : "100px",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "center",
          flexShrink: 0,
          margin: "0 auto",
        }}
      />
    </div>
  );
}
