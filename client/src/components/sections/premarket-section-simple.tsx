import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Cloud, TrendingUp, BarChart3, Target, DollarSign, AlertTriangle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const premarketFormSchema = z.object({
  date: z.date(),
  climateNotes: z.string().optional(),
  hasEconomicEvents: z.boolean().default(false),
  economicEvents: z.string().optional(),
  economicImpact: z.string().optional(),
  vixValue: z.number().optional(),
  expectedVolatility: z.number().min(1).max(100).optional(),
  gammaEnvironment: z.string().optional(),
  bias: z.string().optional(),
  callResistance: z.number().optional(),
  putSupport: z.number().optional(),
  hvlLevel: z.number().optional(),
  vaultLevel: z.number().optional(),
  vwapLevel: z.number().optional(),
  spyCriticalLevel: z.string().optional(),
  spyCriticalLevelType: z.string().optional(),
  spyDirection: z.string().optional(),
  dpofTrend: z.string().optional(),
  dpofVolumeDivergence: z.boolean().default(false),
  dpofCenterline: z.string().optional(),
  dpofExpansionDivergence: z.boolean().default(false),
  dpofAbsorption: z.boolean().default(false),
  volumeGapExists: z.boolean().default(false),
  volumeGapRR: z.string().optional(),
  tradeIdea1: z.string().optional(),
  tradeIdea2: z.string().optional(),
  tradeIdea3: z.string().optional(),
});

type PremarketFormData = z.infer<typeof premarketFormSchema>;

export default function PremarketSection() {
  const [levelsString, setLevelsString] = useState("");
  const { toast } = useToast();
  const today = new Date();

  const form = useForm<PremarketFormData>({
    resolver: zodResolver(premarketFormSchema),
    defaultValues: {
      date: today,
      climateNotes: "",
      hasEconomicEvents: false,
      economicEvents: "",
      economicImpact: "",
      gammaEnvironment: "",
      bias: "",
      spyCriticalLevel: "",
      spyCriticalLevelType: "",
      spyDirection: "",
      dpofTrend: "",
      dpofVolumeDivergence: false,
      dpofCenterline: "",
      dpofExpansionDivergence: false,
      dpofAbsorption: false,
      volumeGapExists: false,
      volumeGapRR: "",
      tradeIdea1: "",
      tradeIdea2: "",
      tradeIdea3: "",
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: PremarketFormData) => {
      return apiRequest("/api/premarket-analysis", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premarket-analysis"] });
      toast({
        title: "Analysis saved",
        description: "Premarket analysis has been saved successfully.",
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

  const onSubmit = (data: PremarketFormData) => {
    saveAnalysisMutation.mutate(data);
  };

  const parseLevelsString = () => {
    if (!levelsString.trim()) return;
    
    try {
      const parts = levelsString.split(',').map(s => s.trim());
      
      for (let i = 0; i < parts.length; i += 2) {
        const label = parts[i]?.toLowerCase();
        const value = parseFloat(parts[i + 1]);
        
        if (isNaN(value)) continue;
        
        if (label?.includes('call resistance')) {
          form.setValue('callResistance', value);
        } else if (label?.includes('put support')) {
          form.setValue('putSupport', value);
        } else if (label?.includes('hvl')) {
          form.setValue('hvlLevel', value);
        }
      }
      
      setLevelsString("");
      toast({
        title: "Levels parsed",
        description: "Successfully parsed Call Resistance, Put Support, and HVL levels.",
      });
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Failed to parse levels string. Please check the format.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Premarket Analysis</h2>
          <p className="text-muted-foreground">Complete market preparation for {format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveAnalysisMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Market Climate */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Cloud className="mr-2 h-5 w-5 text-blue-400" />
                Market Climate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="climateNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">General Market Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write about general market conditions, sentiment, or anything relevant happening today..."
                        className="bg-gray-900 border-gray-600 text-white min-h-[100px]"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Economic Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" />
                Economic Events Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasEconomicEvents"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Economic Announcements Today?
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Any economic events, announcements, or presidential meetings scheduled?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("hasEconomicEvents") && (
                <>
                  <FormField
                    control={form.control}
                    name="economicEvents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Which Events?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List the specific economic events, announcements, or meetings..."
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="economicImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Market Impact Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select impact level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-600">
                            <SelectItem value="high">High Impact</SelectItem>
                            <SelectItem value="medium">Medium Impact</SelectItem>
                            <SelectItem value="low">Low Impact</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* SPY Key Levels Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="mr-2 h-5 w-5 text-red-400" />
                SPY Key Levels Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Levels String Parser */}
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">Quick Parse Levels</h4>
                  <Copy className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Call Resistance, 601, Put Support, 600, HVL, 601, Gamma Flip, 514, Max Pain, 599..."
                    value={levelsString}
                    onChange={(e) => setLevelsString(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={parseLevelsString}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Parse
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Paste your levels string to automatically fill Call Resistance, Put Support, and HVL
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="callResistance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Call Resistance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 601.50"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="putSupport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Put Support</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 600.00"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hvlLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">HVL Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 601.00"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vaultLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Vault Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 599.50"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vwapLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">VWAP Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 600.75"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SPY Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-blue-400" />
                SPY Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="spyCriticalLevelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Trading Near Critical Level?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select critical level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="call_resistance">Call Resistance</SelectItem>
                          <SelectItem value="put_support">Put Support</SelectItem>
                          <SelectItem value="hvl">HVL</SelectItem>
                          <SelectItem value="vault_level">Vault Level</SelectItem>
                          <SelectItem value="vwap">VWAP</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="spyCriticalLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Level Value</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 601.50"
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="spyDirection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Direction Bias</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Long or Short?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="long">Long</SelectItem>
                          <SelectItem value="short">Short</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* DPOF Analysis */}
              <Separator className="bg-gray-600" />
              <h4 className="text-lg font-semibold text-white">DPOF Analysis</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dpofTrend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">DPOF Trend Direction</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select trend direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dpofCenterline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Above or Below Centerline?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="above">Above Centerline</SelectItem>
                          <SelectItem value="below">Below Centerline</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dpofVolumeDivergence"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white">Volume Divergence</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dpofExpansionDivergence"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white">Expansion Divergence</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dpofAbsorption"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white">Absorption</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Volume Gap Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Volume Profile Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="volumeGapExists"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">
                        Volume Gap Exists?
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("volumeGapExists") && (
                <FormField
                  control={form.control}
                  name="volumeGapRR"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Risk/Reward Analysis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the risk/reward for trading the volume gap..."
                          className="bg-gray-900 border-gray-600 text-white"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Trade Ideas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trade Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tradeIdea1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Trade Idea #1</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your first trade idea, setup, and rationale..."
                        className="bg-gray-900 border-gray-600 text-white"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tradeIdea2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Trade Idea #2</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your second trade idea, setup, and rationale..."
                        className="bg-gray-900 border-gray-600 text-white"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tradeIdea3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Trade Idea #3</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your third trade idea, setup, and rationale..."
                        className="bg-gray-900 border-gray-600 text-white"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={saveAnalysisMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveAnalysisMutation.isPending ? "Saving..." : "Save Complete Analysis"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}