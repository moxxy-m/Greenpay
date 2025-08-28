import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { mockRecipients } from "@/lib/mock-data";

export default function SendMoneyPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const { user } = useAuth();

  const filteredRecipients = mockRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.phone?.includes(searchQuery) ||
    recipient.email?.includes(searchQuery)
  );

  const handleContinue = () => {
    if (selectedRecipient) {
      // Store selected recipient in sessionStorage for next step
      sessionStorage.setItem('selectedRecipient', JSON.stringify(selectedRecipient));
      setLocation("/send-amount");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Send Money</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-16 h-1 bg-muted mx-2"></div>
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
          </div>
        </motion.div>

        {/* Recipient Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <h3 className="font-semibold mb-4">Who are you sending to?</h3>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Search by name, email or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="input-search-recipient"
            />
            
            <div className="text-center">
              <span className="text-sm text-muted-foreground">or</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors"
              data-testid="button-add-recipient"
            >
              <span className="material-icons text-muted-foreground mb-2">person_add</span>
              <p className="text-sm font-medium">Add New Recipient</p>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Recipients */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Recent Recipients</h3>
          </div>
          <div className="divide-y divide-border">
            {filteredRecipients.map((recipient, index) => (
              <motion.button
                key={recipient.id}
                whileHover={{ backgroundColor: "var(--muted)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRecipient(recipient)}
                className={`w-full p-4 flex items-center transition-colors text-left ${
                  selectedRecipient?.id === recipient.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                }`}
                data-testid={`recipient-${recipient.id}`}
              >
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">{recipient.initials}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{recipient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {recipient.phone || recipient.email} • {recipient.country}
                  </p>
                </div>
                <div className="text-2xl mr-2">{recipient.flag}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full ripple"
            disabled={!selectedRecipient}
            data-testid="button-continue"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
