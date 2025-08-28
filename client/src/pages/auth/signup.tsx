import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { mockCountries } from "@/lib/mock-data";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  country: z.string().min(1, "Please select your country"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: Omit<SignupForm, "confirmPassword" | "agreeToTerms">) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Account created!",
        description: "Please verify your phone number to continue.",
      });
      setLocation("/otp-verification");
    },
    onError: () => {
      toast({
        title: "Signup failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, agreeToTerms, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Create Account</h1>
      </motion.div>

      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Join GreenPay</h2>
            <p className="text-muted-foreground">Create your account to start sending money</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        data-testid="input-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <select className="px-3 py-3 border border-border rounded-l-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring">
                          <option>+1</option>
                          <option>+44</option>
                          <option>+234</option>
                          <option>+254</option>
                        </select>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="Phone number"
                          className="flex-1 rounded-l-none border-l-0"
                          data-testid="input-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCountries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.flag} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a strong password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-ring mt-1"
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <span className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <a href="#" className="text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full ripple"
                disabled={signupMutation.isPending}
                data-testid="button-create-account"
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-medium"
                data-testid="link-signin"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
