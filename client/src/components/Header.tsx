import { useEventContext } from "@/contexts/EventContext";
import { useState } from "react";

type TabType = "event" | "location" | "activity";

interface HeaderProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export function Header({ currentTab, setCurrentTab }: HeaderProps) {
  const { isAdmin, toggleAdmin } = useEventContext();

  return (
    <header className="px-4 pt-6 pb-2 bg-background sticky top-0 z-10 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-heading font-bold text-foreground">RSVP Party</h1>
        <button 
          onClick={toggleAdmin} 
          className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-full transition text-muted-foreground"
        >
          {isAdmin ? "Exit Admin" : "Host View"}
        </button>
      </div>
      
      <div className="flex border-b">
        <button 
          className={`flex-1 py-3 px-2 text-center ${currentTab === 'event' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('event')}
        >
          Event
        </button>
        <button 
          className={`flex-1 py-3 px-2 text-center ${currentTab === 'location' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('location')}
        >
          Location
        </button>
        <button 
          className={`flex-1 py-3 px-2 text-center ${currentTab === 'activity' ? 'active-tab' : 'text-muted-foreground'}`} 
          onClick={() => setCurrentTab('activity')}
        >
          Activity
        </button>
      </div>
    </header>
  );
}
