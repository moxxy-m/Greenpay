import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "transactions", icon: "receipt_long", label: "Transactions", path: "/transactions" },
  { id: "virtual-card", icon: "credit_card", label: "Card", path: "/virtual-card" },
  { id: "support", icon: "support_agent", label: "Support", path: "/support" },
  { id: "settings", icon: "settings", label: "Settings", path: "/settings" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Only show bottom navigation on authenticated pages
  const showBottomNav = isAuthenticated && (
    location.startsWith('/dashboard') ||
    location.startsWith('/transactions') ||
    location.startsWith('/virtual-card') ||
    location.startsWith('/support') ||
    location.startsWith('/settings') ||
    location.startsWith('/send-money') ||
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw')
  );

  if (!showBottomNav) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
      data-testid="bottom-navigation"
    >
      <div className="bg-card border-t border-border p-4 elevation-3">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setLocation(item.path)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <span className="material-icons text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
