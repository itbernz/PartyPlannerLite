import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { EventTab } from "@/components/EventTab";
import { LocationTab } from "@/components/LocationTab";
import { ActivityTab } from "@/components/ActivityTab";
import { AdminView } from "@/components/AdminView";
import { useEventContext } from "@/contexts/EventContext";
import { useSocket } from "@/hooks/useSocket";

type TabType = "event" | "location" | "activity";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabType>("event");
  const { isAdmin } = useEventContext();
  
  // Initialize WebSocket connection
  useSocket();

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main className="pb-20">
        {isAdmin ? (
          <AdminView />
        ) : (
          <>
            {currentTab === "event" && <EventTab />}
            {currentTab === "location" && <LocationTab />}
            {currentTab === "activity" && <ActivityTab />}
          </>
        )}
      </main>
    </div>
  );
}
