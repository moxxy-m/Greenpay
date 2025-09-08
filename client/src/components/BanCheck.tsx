import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface BanCheckProps {
  children: React.ReactNode;
}

export default function BanCheck({ children }: BanCheckProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is banned and not already on banned page
    if (user && user.isBanned && location !== "/banned") {
      setLocation("/banned");
    }
  }, [user, location, setLocation]);

  // If user is banned and not on the banned page, don't render children
  if (user && user.isBanned && location !== "/banned") {
    return null;
  }

  return <>{children}</>;
}