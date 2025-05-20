import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { EventProvider } from "./contexts/EventContext";
import { ThemeProvider } from "./components/ui/theme-provider";

import EventsList from "@/pages/events-list";
import EventView from "@/pages/event-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={EventsList} />
      <Route path="/events/:id" component={EventView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="rsvp-theme">
        <TooltipProvider>
          <EventProvider>
            <Toaster />
            <Router />
          </EventProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
