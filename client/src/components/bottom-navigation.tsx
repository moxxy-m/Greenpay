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

  // Hide bottom navigation in external windows and non-authenticated pages
  const isExternal = window.opener !== null || window.parent !== window;
  
  // Only show bottom navigation on authenticated pages and not in external view
  const showBottomNav = !isExternal && isAuthenticated && (
    location.startsWith('/dashboard') ||
    location.startsWith('/transactions') ||
    location.startsWith('/virtual-card') ||
    location.startsWith('/support') ||
    location.startsWith('/settings') ||
    location.startsWith('/send-money') ||
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw') ||
    location.startsWith('/exchange')
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
      <div className="bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-sm border-t border-border/20 p-2 elevation-3 shadow-lg">
        <div className="flex justify-around max-w-sm mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setLocation(item.path)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 min-w-[60px] ${
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-lg backdrop-blur-sm border border-primary/20' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <span className={`material-icons mb-1 transition-all duration-200 ${
                  isActive ? 'text-lg' : 'text-base'
                }`}>{item.icon}</span>
                <span className={`text-xs font-semibold transition-all duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-80'
                }`}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
