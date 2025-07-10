import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, ChartLine, Edit, Filter, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateOptionsPnL, classifyTimeOfDay } from "@/lib/trade-calculations";
import type { Trade, PlaybookStrategy } from "@shared/schema";

const tradeFormSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  type: z.enum(["calls", "puts"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  strikePrice: z.coerce.number().min(0, "Strike price must be positive"),
  entryPrice: z.coerce.number().min(0, "Entry price must be positive"),
  exitPrice: z.coerce.number().min(0, "Exit price must be positive"),
  entryTime: z.string().min(1, "Entry time is required"),
  exitTime: z.string().optional(),
  expirationDate: z.string().min(1, "Expiration date is required"),
  usePlaybook: z.boolean().optional(),
  entryReason: z.string().optional(),
  exitReason: z.string().optional(),
  playbookId: z.coerce.number().min(1, "Strategy selection is required"),
  tradeDate: z.string().min(1, "Trade date is required"),
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

interface TradesSectionProps {
  onNavigateToAnalysis?: (tradeId: number, section?: 'analysis' | 'edit') => void;
}

export default function TradesSection({ onNavigateToAnalysis }: TradesSectionProps = {}) {
  const [entrySource, setEntrySource] = useState<"playbook" | "custom">("playbook");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current CST date and time
  const getCurrentCSTDate = () => {
    const now = new Date();
    const cstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    return cstTime.toISOString().split('T')[0];
  };

  const getCurrentCSTTime = () => {
    const now = new Date();
    const cstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    return cstTime.toTimeString().split(' ')[0].substring(0, 5);
  };

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      ticker: "SPY",
      type: "calls",
      quantity: 1,
      strikePrice: 0,
      entryPrice: 0,
      exitPrice: 0,
      entryTime: getCurrentCSTTime(),
      exitTime: "",
      expirationDate: getCurrentCSTDate(),
      entryReason: "",
      exitReason: "",
      tradeDate: getCurrentCSTDate(),
    },
  });

  // Fetch trades
  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // Fetch playbook strategies
  const { data: strategies = [] } = useQuery<PlaybookStrategy[]>({
    queryKey: ['/api/playbook-strategies'],
  });

  // Create trade mutation
  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const tradeData = {
        ticker: data.ticker,
        type: data.type,
        quantity: data.quantity,
        strikePrice: data.strikePrice,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        entryTime: new Date(`${data.tradeDate} ${data.entryTime}`),
        exitTime: data.exitTime ? new Date(`${data.tradeDate} ${data.exitTime}`) : null,
        expirationDate: new Date(data.expirationDate),
        entryReason: data.entryReason,
        exitReason: data.exitReason,
        playbookId: data.playbookId,
        tradeDate: new Date(data.tradeDate),
      };
      
      return apiRequest('/api/trades', 'POST', tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/analytics'] });
      form.reset();
      toast({
        title: "Trade Added",
        description: "Trade has been successfully logged.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      return apiRequest(`/api/trades/${tradeId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/analytics'] });
      toast({
        title: "Trade Deleted",
        description: "Trade has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TradeFormData) => {
    createTradeMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const calculatedPnL = watchedValues.exitPrice && watchedValues.entryPrice && watchedValues.quantity
    ? calculateOptionsPnL(watchedValues.entryPrice, watchedValues.exitPrice, watchedValues.quantity)
    : null;

  const timeClassification = watchedValues.entryTime 
    ? classifyTimeOfDay(watchedValues.entryTime)
    : null;

  return (
    <div className="space-y-6 w-full max-w-full px-2 sm:px-4">
      {/* Trade Entry Form */}
      <Card className="w-full max-w-full">
        <CardHeader className="px-3 sm:px-6">
          <CardTitle>New Trade Entry</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
              <div className="space-y-4 w-full">
                <FormField
                  control={form.control}
                  name="tradeDate"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-full">
                      <FormLabel>Trade Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="w-full max-w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticker"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-full">
                      <FormLabel>Ticker</FormLabel>
                      <FormControl>
                        <Input placeholder="SPY, QQQ, etc." {...field} className="w-full max-w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-full">
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="w-full max-w-full">
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
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-full">
                      <FormLabel>Contracts</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                          placeholder="Enter quantity"
                          className="w-full max-w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strikePrice"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Strike Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder="Enter strike price"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder="Enter entry price"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Exit Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder="Enter exit price"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryTime"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Entry Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitTime"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Exit Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Strategy Selection */}
              <FormField
                control={form.control}
                name="playbookId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Trading Strategy</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a strategy" />
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

              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Entry Reason</Label>
                  <RadioGroup
                    value={entrySource}
                    onValueChange={(value: "playbook" | "custom") => {
                      setEntrySource(value);
                      form.setValue("usePlaybook", value === "playbook");
                    }}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="playbook" id="playbook" />
                      <Label htmlFor="playbook">From Playbook</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Custom</Label>
                    </div>
                  </RadioGroup>

                  {entrySource === "playbook" ? (
                    <FormField
                      control={form.control}
                      name="playbookId"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger className="w-full">
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
                  ) : (
                    <FormField
                      control={form.control}
                      name="entryReason"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <Textarea 
                              placeholder="Explain why you took this trade"
                              className="h-20 w-full"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="exitReason"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Exit Reason</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why you exited this trade"
                          className="h-20 w-full"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground space-y-2 sm:space-y-0 sm:space-x-4">
                  {timeClassification && (
                    <div className="sm:inline">
                      Time Classification: <span className="font-medium text-primary">{timeClassification}</span>
                    </div>
                  )}
                  {calculatedPnL !== null && (
                    <div className="sm:inline">
                      P&L: <span className={`font-medium ${calculatedPnL >= 0 ? 'trade-positive' : 'trade-negative'}`}>
                        {calculatedPnL >= 0 ? '+' : ''}${calculatedPnL.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={createTradeMutation.isPending}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trade
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trades</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tradesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trades yet. Add your first trade above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-sm">#{trade.id}</TableCell>
                      <TableCell className="font-medium">{trade.ticker}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={trade.type === 'calls' ? 'default' : 'secondary'}
                          className={trade.type === 'calls' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
                        >
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell>${trade.strikePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trade.expirationDate ? new Date(trade.expirationDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {trade.pnl !== null ? (
                          <span className={`font-semibold ${trade.pnl >= 0 ? 'trade-positive' : 'trade-negative'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {trade.timeClassification || 'Other'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Analyze"
                            onClick={() => onNavigateToAnalysis?.(trade.id, 'analysis')}
                          >
                            <ChartLine className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit"
                            onClick={() => onNavigateToAnalysis?.(trade.id, 'edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete"
                            onClick={() => deleteTradeMutation.mutate(trade.id)}
                            disabled={deleteTradeMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
