import { Card, CardContent } from "@/components/ui/card";
import { useEvent } from "@/hooks/useEvent";
import { Loader2 } from "lucide-react";

export function LocationTab() {
  const { event, isLoading } = useEvent();

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Location information not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="rounded-xl overflow-hidden mb-6">
        <img 
          src="https://pixabay.com/get/g45268046675b0068504f335a3fcaefe9be1616cecb43bc6fb0a77745d7fb92ef6a8edfbd90430cabcd93013a279d5a77d1d4444b39a3b2439237ca9525ff999e_1280.jpg" 
          alt="Rooftop venue" 
          className="w-full h-48 object-cover" 
        />
        
        <CardContent className="p-4">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Location Details</h2>
          
          <div className="mt-4">
            <h3 className="font-semibold text-lg">Address</h3>
            <p className="text-foreground mt-1">{event.locationText}</p>
            <p className="text-foreground">New York, NY 10001</p>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>
            <p className="text-foreground mt-1">
              {event.locationNotes}
            </p>
          </div>
          
          <div className="mt-6 bg-muted p-3 rounded-lg">
            <h3 className="font-semibold">Getting There</h3>
            <ul className="mt-2 space-y-2 text-foreground">
              <li className="flex items-start">
                <span className="text-primary font-medium mr-2">•</span> 
                <span>Subway: 2 blocks from the L train at 1st Avenue station</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-medium mr-2">•</span> 
                <span>Parking: Available at the public garage on 14th Street</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-medium mr-2">•</span> 
                <span>Rideshare: Drop-off in front of the building is recommended</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
