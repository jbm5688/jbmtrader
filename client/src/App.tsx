import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import BrokerSetup from "@/pages/broker-setup";
import NotFound from "@/pages/not-found";
import { useState } from "react";

interface BrokerConfig {
  broker: string;
  email: string;
  password: string;
  apiKey?: string;
  demo: boolean;
}

function Router() {
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig | null>(null);

  const handleBrokerSetup = (config: BrokerConfig) => {
    setBrokerConfig(config);
    setBrokerConnected(true);
  };

  if (!brokerConnected) {
    return <BrokerSetup onComplete={handleBrokerSetup} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard brokerConfig={brokerConfig} />} />
      <Route path="/setup" component={() => <BrokerSetup onComplete={handleBrokerSetup} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
