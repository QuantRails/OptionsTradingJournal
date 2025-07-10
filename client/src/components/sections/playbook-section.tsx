import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PlaybookStrategy, Trade } from "@shared/schema";

const strategyFormSchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().min(1, "Description is required"),
});

type StrategyFormData = z.infer<typeof strategyFormSchema>;

export default function PlaybookSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<PlaybookStrategy | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StrategyFormData>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch strategies
  const { data: strategies = [] } = useQuery<PlaybookStrategy[]>({
    queryKey: ['/api/playbook-strategies'],
  });

  // Fetch trades to calculate strategy performance
  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // Create strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (data: StrategyFormData) => {
      return apiRequest('/api/playbook-strategies', 'POST', {
        ...data,
        isDefault: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-strategies'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Strategy Created",
        description: "New trading strategy has been added to your playbook.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update strategy mutation
  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StrategyFormData }) => {
      return apiRequest(`/api/playbook-strategies/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-strategies'] });
      setIsDialogOpen(false);
      setEditingStrategy(null);
      form.reset();
      toast({
        title: "Strategy Updated",
        description: "Trading strategy has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/playbook-strategies/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playbook-strategies'] });
      toast({
        title: "Strategy Deleted",
        description: "Trading strategy has been removed from your playbook.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete strategy. Default strategies cannot be deleted.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StrategyFormData) => {
    if (editingStrategy) {
      updateStrategyMutation.mutate({ id: editingStrategy.id, data });
    } else {
      createStrategyMutation.mutate(data);
    }
  };

  const openEditDialog = (strategy: PlaybookStrategy) => {
    setEditingStrategy(strategy);
    form.setValue("name", strategy.name);
    form.setValue("description", strategy.description || "");
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStrategy(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Calculate strategy performance
  const getStrategyPerformance = (strategy: PlaybookStrategy) => {
    const strategyTrades = trades.filter(trade => trade.playbookId === strategy.id && trade.pnl !== null);
    const totalTrades = strategyTrades.length;
    
    if (totalTrades === 0) {
      return { winRate: 0, avgRR: 0, usage: 0, totalPnL: 0 };
    }
    
    const winningTrades = strategyTrades.filter(trade => trade.pnl !== null && trade.pnl > 0);
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length : 0;
    const losingTrades = strategyTrades.filter(trade => trade.pnl !== null && trade.pnl <= 0);
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length) : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    const totalPnL = strategyTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    return { winRate, avgRR, usage: totalTrades, totalPnL };
  };

  return (
    <div className="space-y-6">
      {/* Current Playbook */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trading Playbook</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Strategy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStrategy ? 'Edit Strategy' : 'Add New Strategy'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Breakout above resistance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the strategy setup and rules..."
                              className="h-24"
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
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createStrategyMutation.isPending || updateStrategyMutation.isPending}
                      >
                        {editingStrategy ? 'Update' : 'Create'} Strategy
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No strategies in your playbook yet. Add your first strategy above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy) => {
                const performance = getStrategyPerformance(strategy);
                return (
                  <div 
                    key={strategy.id} 
                    className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(strategy)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!strategy.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{strategy.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStrategyMutation.mutate(strategy.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      {strategy.description || "No description available"}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className={performance.winRate >= 60 ? 'text-success' : performance.winRate >= 40 ? 'text-warning' : 'text-destructive'}>
                          {performance.winRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg R:R:</span>
                        <span>{performance.avgRR > 0 ? `1:${performance.avgRR.toFixed(1)}` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span>{performance.usage} trades</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total P&L:</span>
                        <span className={performance.totalPnL >= 0 ? 'trade-positive' : 'trade-negative'}>
                          {performance.totalPnL >= 0 ? '+' : ''}${performance.totalPnL.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Strategy Card */}
              <div 
                className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer min-h-[180px]"
                onClick={openCreateDialog}
              >
                <Plus className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">Add New Strategy</p>
                <p className="text-sm text-muted-foreground mt-1">Create a custom trading strategy</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategy Performance Summary */}
      {strategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strategy Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Strategy</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Trades</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Win Rate</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Avg R:R</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strategy) => {
                    const performance = getStrategyPerformance(strategy);
                    return (
                      <tr key={strategy.id} className="border-b border-border/50">
                        <td className="py-2 font-medium">{strategy.name}</td>
                        <td className="py-2">{performance.usage}</td>
                        <td className="py-2">
                          <span className={performance.winRate >= 60 ? 'text-success' : performance.winRate >= 40 ? 'text-warning' : 'text-destructive'}>
                            {performance.winRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2">
                          {performance.avgRR > 0 ? `1:${performance.avgRR.toFixed(1)}` : 'N/A'}
                        </td>
                        <td className="py-2">
                          <span className={performance.totalPnL >= 0 ? 'trade-positive' : 'trade-negative'}>
                            {performance.totalPnL >= 0 ? '+' : ''}${performance.totalPnL.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
