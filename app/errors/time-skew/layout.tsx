import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Sync Error - LearnHub",
  description: "ตรวจพบปัญหาการซิงค์เวลา กรุณาตรวจสอบและอัพเดตเวลาให้ถูกต้อง",
};

export default function TimeSkewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
