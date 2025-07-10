import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CloudUpload, Save, Image, X, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Trade, TradeAnalysis, IntradayNote, PlaybookStrategy } from "@shared/schema";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const analysisFormSchema = z.object({
  tradeId: z.number().min(1, "Please select a trade"),
  whatWentWell: z.string().min(1, "Please describe what went well"),
  whatToImprove: z.string().min(1, "Please describe what could be improved"),
  nextTime: z.string().min(1, "Please describe what you'll do better next time"),
  screenshotUrl: z.string().optional(),
});

type AnalysisFormData = z.infer<typeof analysisFormSchema>;

// Trade edit form schema
const tradeEditSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  type: z.enum(["calls", "puts"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  strikePrice: z.number().min(0, "Strike price must be positive"),
  entryPrice: z.number().min(0, "Entry price must be positive"),
  exitPrice: z.number().min(0, "Exit price must be positive").optional(),
  entryTime: z.string().min(1, "Entry time is required"),
  exitTime: z.string().optional(),
  entryReason: z.string().optional(),
  exitReason: z.string().optional(),
  playbookId: z.number().min(1, "Strategy is required"),
});

type TradeEditFormData = z.infer<typeof tradeEditSchema>;

export default function AnalysisSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      // Check if a date was passed from calendar navigation
      const savedDate = localStorage.getItem('quantrails-selected-date');
      if (savedDate) {
        localStorage.removeItem('quantrails-selected-date'); // Clear after reading
        const date = new Date(savedDate);
        // Validate the date
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.warn('Error reading saved date:', error);
    }
    return new Date();
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      whatWentWell: "",
      whatToImprove: "",
      nextTime: "",
    },
  });

  // Fetch trades for selection
  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // Fetch existing trade analyses
  const { data: analyses = [], isLoading: analysesLoading } = useQuery<TradeAnalysis[]>({
    queryKey: ['/api/trade-analysis'],
  });

  // Fetch intraday notes for the selected date
  const { data: intradayNotes = [], isLoading: notesLoading } = useQuery<IntradayNote[]>({
    queryKey: ['/api/intraday-notes'],
  });

  // Fetch playbook strategies to show strategy info with trades
  const { data: strategies = [] } = useQuery<PlaybookStrategy[]>({
    queryKey: ['/api/playbook-strategies'],
  });

  // Early return if there's an error loading trades
  if (tradesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading trades. Please refresh the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter all trades (not just completed ones) for analysis
  const allTrades = trades;

  // Filter trades by selected date using tradeDate field
  const tradesOnDate = allTrades.filter(trade => {
    if (!trade.tradeDate) return false;
    const tradeDate = new Date(trade.tradeDate);
    return tradeDate.toDateString() === selectedDate.toDateString();
  });

  // Filter notes by selected date
  const notesOnDate = intradayNotes.filter(note => {
    if (!note.time) return false;
    try {
      const noteDate = new Date(note.time);
      return noteDate.toDateString() === selectedDate.toDateString();
    } catch {
      return false;
    }
  });

  // Watch selected trade ID to load existing analysis
  const selectedTradeId = form.watch("tradeId");
  
  // Fetch existing analysis for selected trade
  const { data: existingAnalysis } = useQuery<TradeAnalysis>({
    queryKey: ['/api/trade-analysis/trade', selectedTradeId],
    enabled: !!selectedTradeId,
  });

  // Reset selected trade when date changes
  React.useEffect(() => {
    form.setValue("tradeId", 0);
  }, [selectedDate, form]);

  // Load existing analysis data when trade is selected
  React.useEffect(() => {
    if (existingAnalysis) {
      form.setValue("whatWentWell", existingAnalysis.whatWentWell || "");
      form.setValue("whatToImprove", existingAnalysis.whatToImprove || "");
      form.setValue("nextTime", existingAnalysis.nextTime || "");
    } else {
      // Clear form when no existing analysis
      form.setValue("whatWentWell", "");
      form.setValue("whatToImprove", "");
      form.setValue("nextTime", "");
    }
  }, [existingAnalysis, form]);

  // Create/update analysis mutation
  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: AnalysisFormData) => {
      if (existingAnalysis) {
        // Update existing analysis
        return apiRequest(`/api/trade-analysis/${existingAnalysis.id}`, 'PATCH', data);
      } else {
        // Create new analysis
        return apiRequest('/api/trade-analysis', 'POST', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trade-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trade-analysis/trade', selectedTradeId] });
      toast({
        title: "Analysis Saved",
        description: "Trade analysis has been successfully saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const onSubmit = (data: AnalysisFormData) => {
    saveAnalysisMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Analysis Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {tradesOnDate.length} trades on this date
              </Badge>
              <Badge variant="outline">
                {notesOnDate.length} notes on this date
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Analysis Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-1/3">
            <Form {...form}>
              <FormField
                control={form.control}
                name="tradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Trade for Analysis</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tradesOnDate.length > 0 ? (
                          tradesOnDate.map((trade) => {
                            const strategy = strategies.find(s => s.id === trade.playbookId);
                            return (
                              <SelectItem key={trade.id} value={trade.id.toString()}>
                                <div className="flex flex-col">
                                  <div>
                                    Trade #{trade.id} - {trade.ticker} {trade.type}
                                    {trade.pnl !== null && trade.pnl !== undefined ? (
                                      <span className={trade.pnl >= 0 ? ' text-green-600' : ' text-red-600'}>
                                        {' '}({trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)})
                                      </span>
                                    ) : (
                                      <span className="text-gray-500"> (Pending)</span>
                                    )}
                                  </div>
                                  {strategy && (
                                    <div className="text-xs text-muted-foreground">
                                      Strategy: {strategy.name}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-trades" disabled>
                            No trades on {format(selectedDate, "MMM d, yyyy")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        </CardContent>
      </Card>

      {selectedTradeId && (
        <>
          {/* Trade Analysis Form */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart Upload */}
                    <div>
                      <h4 className="font-semibold mb-4">Chart Screenshot</h4>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="chart-upload"
                        />
                        <label htmlFor="chart-upload" className="cursor-pointer">
                          <CloudUpload className="mx-auto text-4xl text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">Drop chart screenshot here or click to browse</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                        </label>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 space-y-4">
                          <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Image className="text-primary" />
                                <div>
                                  <p className="font-medium">{selectedFile.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Screenshot Preview */}
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Chart screenshot"
                              className="w-full max-w-md mx-auto rounded-lg border border-border shadow-sm"
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Analysis Questions */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="whatWentWell"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What went well in this trade?</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what you executed correctly..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatToImprove"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What could have been improved?</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe areas for improvement..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nextTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What will you do differently next time?</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your action plan for future trades..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={saveAnalysisMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Complete Trade Details with Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Trade Details</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const selectedTrade = allTrades.find((t: Trade) => t.id === selectedTradeId);
                if (!selectedTrade) return <div>Trade not found</div>;
                
                const TradeEditFormComponent = () => {
                  const tradeForm = useForm<TradeEditFormData>({
                    resolver: zodResolver(tradeEditSchema),
                    defaultValues: {
                      ticker: selectedTrade.ticker,
                      type: selectedTrade.type as "calls" | "puts",
                      quantity: selectedTrade.quantity,
                      strikePrice: selectedTrade.strikePrice,
                      entryPrice: selectedTrade.entryPrice,
                      exitPrice: selectedTrade.exitPrice || undefined,
                      entryTime: format(new Date(selectedTrade.entryTime), "yyyy-MM-dd'T'HH:mm"),
                      exitTime: selectedTrade.exitTime ? format(new Date(selectedTrade.exitTime), "yyyy-MM-dd'T'HH:mm") : "",
                      entryReason: selectedTrade.entryReason || "",
                      exitReason: selectedTrade.exitReason || "",
                      playbookId: selectedTrade.playbookId || 1,
                    },
                  });

                  const updateTradeMutation = useMutation({
                    mutationFn: async (data: TradeEditFormData) => {
                      const updateData = {
                        ...data,
                        entryTime: new Date(data.entryTime).toISOString(),
                        exitTime: data.exitTime ? new Date(data.exitTime).toISOString() : null,
                        exitPrice: data.exitPrice || null,
                        playbookId: data.playbookId,
                      };
                      return apiRequest(`/api/trades/${selectedTrade.id}`, 'PATCH', updateData);
                    },
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/performance/analytics'] });
                      toast({
                        title: "Trade Updated",
                        description: "Trade details have been successfully updated.",
                      });
                    },
                    onError: () => {
                      toast({
                        title: "Error",
                        description: "Failed to update trade. Please try again.",
                        variant: "destructive",
                      });
                    },
                  });

                  const onTradeSubmit = (data: TradeEditFormData) => {
                    updateTradeMutation.mutate(data);
                  };

                  return (
                    <Form {...tradeForm}>
                      <form onSubmit={tradeForm.handleSubmit(onTradeSubmit)}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={tradeForm.control}
                            name="ticker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ticker</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="SPY" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="calls">Calls</SelectItem>
                                    <SelectItem value="puts">Puts</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contracts</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="strikePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Strike Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    placeholder="450.00"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="entryPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Entry Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    placeholder="2.50"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="exitPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exit Price ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    placeholder="3.75"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="entryTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Entry Time (CST)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="exitTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exit Time (CST)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="entryReason"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2 lg:col-span-3">
                                <FormLabel>Entry Reason</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Describe why you entered this trade..."
                                    className="resize-none"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="exitReason"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2 lg:col-span-3">
                                <FormLabel>Exit Reason</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Describe why you exited this trade..."
                                    className="resize-none"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tradeForm.control}
                            name="playbookId"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2 lg:col-span-3">
                                <FormLabel>Strategy</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value?.toString() || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select strategy" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {strategies.map((strategy) => (
                                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                        {strategy.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end mt-6">
                          <Button 
                            type="submit" 
                            disabled={updateTradeMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateTradeMutation.isPending ? "Updating..." : "Update Trade"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  );
                };
                
                return <TradeEditFormComponent />;
              })()}
            </CardContent>
          </Card>
        </>
      )}

      {/* Intraday Notes for Selected Date */}
      {notesOnDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Intraday Notes for {format(selectedDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notesOnDate.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(note.time), "h:mm a")}
                    </p>
                  </div>
                  <p className="text-sm">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}