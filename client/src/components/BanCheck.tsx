import React from "react";

interface BanCheckProps {
  children: React.ReactNode;
}

export default function BanCheck({ children }: BanCheckProps) {
  // Since we no longer have banned users, this component simply renders children
  return <>{children}</>;
}