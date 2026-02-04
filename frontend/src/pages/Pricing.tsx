import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    description: "Essential features for personal use",
    price: "$0",
    duration: "forever",
    features: [
      "5 Notes limit",
      "Basic text formatting",
      "Cloud sync",
      "Mobile access",
    ],
    cta: "Get Started",
    popular: false,
    lookup_key: null,
  },
  {
    name: "Pro",
    description: "Perfect for power users who need more",
    price: "$9",
    duration: "month",
    features: [
      "Unlimited notes",
      "Rich text editor",
      "Priority support",
      "No ads",
      "Offline access",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    lookup_key: "pro_monthly",
  },
  {
    name: "Pro+",
    description: "Ultimate productivity for teams",
    price: "$19",
    duration: "month",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Admin dashboard",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
    cta: "Upgrade to Pro+",
    popular: false,
    lookup_key: "pro_plus_monthly",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (lookupKey: string | null) => {
    if (!lookupKey) {
      navigate("/auth/register");
      return;
    }

    setLoading(lookupKey);
    try {
      const response = await api.post("/billing/create-checkout-session", {
        lookup_key: lookupKey,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to start checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-blue-300">
            Choose the plan that's right for your galactic journey
          </p>
          <Button
            variant="link"
            className="mt-4 text-blue-400 hover:text-blue-300"
            onClick={() => navigate("/")}
          >
            ← Back to Archives
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col relative bg-gray-800/50 border-gray-700 text-gray-100 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/70 ${
                plan.popular
                  ? "border-blue-500 shadow-lg shadow-blue-900/20 scale-105 z-10"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg shadow-blue-900/50">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-blue-300">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">/{plan.duration}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                      : "bg-transparent border-blue-600 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.lookup_key)}
                  disabled={loading !== null}
                >
                  {loading === plan.lookup_key ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;