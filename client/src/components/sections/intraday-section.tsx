import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Clock, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertIntradayNoteSchema, type IntradayNote } from "@shared/schema";
import { useAutoSave } from "@/hooks/use-autosave";

const noteFormSchema = insertIntradayNoteSchema.extend({
  date: z.date(),
  time: z.date(),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

export default function IntradaySection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all intraday notes
  const { data: notes = [], isLoading } = useQuery<IntradayNote[]>({
    queryKey: ["/api/intraday-notes"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      return apiRequest("/api/intraday-notes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intraday-notes"] });
      setIsDialogOpen(false);
      toast({
        title: "Note added",
        description: "Your intraday note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiRequest(`/api/intraday-notes/${noteId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intraday-notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: "",
      date: new Date(),
      time: new Date(),
    },
  });

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  // Group notes by date
  const notesByDate = notes.reduce((acc, note) => {
    const dateKey = format(new Date(note.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(note);
    return acc;
  }, {} as Record<string, IntradayNote[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(notesByDate).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Intraday Notes</h2>
          <p className="text-muted-foreground">Track your thoughts and observations throughout the trading day</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Intraday Note</DialogTitle>
              <DialogDescription>
                Record your trading thoughts, market observations, or strategy notes
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Note Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your trading notes, observations, or thoughts..."
                          className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createNoteMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedDates.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No notes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start adding intraday notes to track your trading thoughts and observations
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateNotes = notesByDate[dateKey];
            const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;
            
            return (
              <Card key={dateKey} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-white">
                        {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                      </CardTitle>
                      {isToday && (
                        <Badge variant="secondary" className="bg-blue-600 text-white">
                          Today
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {dateNotes.length} note{dateNotes.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dateNotes
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(note.time), "h:mm a")}</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this note? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteNoteMutation.mutate(note.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}