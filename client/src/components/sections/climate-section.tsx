import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { useAutoSave } from "@/hooks/use-autosave";
import { apiRequest } from "@/lib/queryClient";

export default function ClimateSection() {
  const [climateNotes, setClimateNotes] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  // Fetch today's premarket analysis for climate notes
  const { data: todayAnalysis } = useQuery({
    queryKey: ['/api/premarket-analysis/today'],
  });

  // Initialize notes from existing analysis
  useEffect(() => {
    if (todayAnalysis?.climateNotes) {
      setClimateNotes(todayAnalysis.climateNotes);
    }
  }, [todayAnalysis]);

  // Mutation to save climate notes
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (todayAnalysis) {
        // Update existing analysis
        return apiRequest('PATCH', `/api/premarket-analysis/${todayAnalysis.id}`, {
          climateNotes: notes
        });
      } else {
        // Create new analysis
        return apiRequest('POST', '/api/premarket-analysis', {
          date: today.toISOString(),
          climateNotes: notes
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/premarket-analysis/today'] });
      setLastSaved(new Date());
    },
  });

  // Auto-save functionality
  useAutoSave(climateNotes, (value) => {
    if (value.trim()) {
      saveNotesMutation.mutate(value);
    }
  }, 2000);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Market Climate Notes</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Save className="w-4 h-4" />
            <span>
              {lastSaved 
                ? `Auto-saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Auto-save enabled'
              }
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea 
          className="w-full h-64 bg-background border-border rounded-lg p-4 text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter your general market observations, sentiment analysis, and overall trading climate notes here..."
          value={climateNotes}
          onChange={(e) => setClimateNotes(e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
