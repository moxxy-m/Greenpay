import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface BanCheckProps {
  children: React.ReactNode;
}

export default function BanCheck({ children }: BanCheckProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Only check ban status if user data is loaded and user exists
    if (!isLoading && user && user.isBanned && location !== "/banned") {
      setLocation("/banned");
    }
  }, [user, location, setLocation, isLoading]);

  // Show loading while checking user status
  if (isLoading) {
    return null;
  }

  // If user is banned and not on the banned page, don't render children
  if (user && user.isBanned && location !== "/banned") {
    return null;
  }

  return <>{children}</>;
}