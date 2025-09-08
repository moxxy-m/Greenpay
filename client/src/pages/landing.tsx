import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Globe, CreditCard, Users, Zap, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Globe,
      title: "Global Transfers",
      description: "Send money to Africa with competitive rates and fast processing times."
    },
    {
      icon: CreditCard,
      title: "Virtual Cards",
      description: "Get instant virtual debit cards for online shopping and payments."
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security with full KYC verification and regulatory compliance."
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Lightning-fast transactions with real-time status updates."
    }
  ];

  const stats = [
    { label: "Countries Supported", value: "54+" },
    { label: "Active Users", value: "10K+" },
    { label: "Total Transfers", value: "$2M+" },
    { label: "Success Rate", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-green-600">GreenPay</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation("/login")}>
                Sign In
              </Button>
              <Button onClick={() => setLocation("/signup")} className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Now Available - Virtual Cards & M-Pesa Integration
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Send Money to
              <span className="text-green-600"> Africa</span>
              <br />
              Instantly & Securely
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The fastest and most secure way to send money to your loved ones in Africa. 
              Get virtual cards, competitive exchange rates, and instant transfers with GreenPay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/signup")}
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                data-testid="button-get-started"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/login")}
                className="text-lg px-8 py-3"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GreenPay?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the modern African diaspora with cutting-edge technology and unmatched reliability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Sending Money?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of satisfied customers who trust GreenPay for their money transfers.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/signup")}
            className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3"
            data-testid="button-cta-signup"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-4">GreenPay</h3>
            <p className="text-gray-400 mb-6">
              Secure, fast, and reliable money transfers to Africa.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <span>© 2024 GreenPay. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}