import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertPremarketAnalysisSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Enhanced schema that matches the markdown specification
const premarketAnalysisSchema = z.object({
  // Climate
  climateNotes: z.string().optional(),
  
  // Economic Events
  hasEconomicEvents: z.boolean().default(false),
  economicEvents: z.string().optional(),
  economicImpact: z.string().optional(),
  
  // Futures - ES
  esTradingNearLevel: z.boolean().default(false),
  esLevelType: z.enum(["Call Resistance", "Put Support", "HVL", "VWAP", "Other"]).optional(),
  esVolumeRating: z.number().min(1).max(100).default(50),
  
  // Futures - NQ
  nqTradingNearLevel: z.boolean().default(false),
  nqLevelType: z.enum(["Call Resistance", "Put Support", "HVL", "VWAP", "Other"]).optional(),
  nqVolumeRating: z.number().min(1).max(100).default(50),
  
  // Futures - RTY
  rtyTradingNearLevel: z.boolean().default(false),
  rtyLevelType: z.enum(["Call Resistance", "Put Support", "HVL", "VWAP", "Other"]).optional(),
  
  // SPY Analysis
  spyCallResistance: z.string().optional(),
  spyPutSupport: z.string().optional(),
  spyHVL: z.string().optional(),
  spyVaultLevels: z.string().optional(),
  spyVWAP: z.string().optional(),
  spyTradingNearLevel: z.boolean().default(false),
  spyLevelType: z.enum(["Call Resistance", "Put Support", "HVL", "Vault Level", "VWAP", "Other"]).optional(),
  spyDirection: z.enum(["Long", "Short"]).optional(),
  
  // DPOF
  dpofTrend: z.enum(["Positive", "Negative"]).optional(),
  dpofVolumeDivergence: z.boolean().default(false),
  dpofAboveCenterline: z.boolean().default(false),
  dpofExpansionDivergence: z.boolean().default(false),
  dpofAbsorption: z.boolean().default(false),
  
  // Volatility Assessment
  vixValue: z.string().optional(),
  expectedVolatility: z.number().min(1).max(100).default(50),
  
  // Volume Profile Gap Analysis
  gapExists: z.boolean().default(false),
  gapRiskReward: z.string().optional(),
  
  // Gamma Exposure
  gammaEnvironment: z.enum(["Positive", "Negative"]).optional(),
  
  // Momentum
  squeezeMomoDirection: z.enum(["Positive", "Negative"]).optional(),
  inSqueeze: z.boolean().default(false),
  
  // Delta Exposure
  deltaAnalyzed: z.boolean().default(false),
  
  // Bond Market
  bondCorrelation: z.enum(["Trending with SPY", "Trending inverse SPY", "No noticeable correlation"]).optional(),
  
  // Bias
  bias: z.enum(["Bullish", "Bearish", "Neutral"]).optional(),
  
  // Trade Ideas
  tradeIdeaTicker: z.string().optional(),
  tradeIdeaType: z.enum(["Calls", "Puts"]).optional(),
  tradeIdeaLevel: z.string().optional(),
  tradeIdeaRiskReward: z.string().optional(),
  tradeIdeaTakeProfit1: z.string().optional(),
  tradeIdeaTakeProfit2: z.string().optional(),
  confidenceLevel: z.number().min(1).max(100).default(50),
  positionSizing: z.enum(["Scaling in", "Go in generously"]).optional(),
});

type PremarketAnalysisFormData = z.infer<typeof premarketAnalysisSchema>;

export default function PremarketAnalysisNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  
  const [expandedSections, setExpandedSections] = useState({
    climate: true,
    economic: true,
    futures: true,
    spyAnalysis: true,
    bondMarket: true,
    bias: true,
    tradeIdea: true,
  });

  const form = useForm<PremarketAnalysisFormData>({
    resolver: zodResolver(premarketAnalysisSchema),
    defaultValues: {
      climateNotes: "",
      hasEconomicEvents: false,
      economicEvents: "",
      economicImpact: "",
      esTradingNearLevel: false,
      esVolumeRating: 50,
      nqTradingNearLevel: false,
      nqVolumeRating: 50,
      rtyTradingNearLevel: false,
      spyCallResistance: "",
      spyPutSupport: "",
      spyHVL: "",
      spyVaultLevels: "",
      spyVWAP: "",
      spyTradingNearLevel: false,
      dpofVolumeDivergence: false,
      dpofAboveCenterline: false,
      dpofExpansionDivergence: false,
      dpofAbsorption: false,
      vixValue: "",
      expectedVolatility: 50,
      gapExists: false,
      gapRiskReward: "",
      inSqueeze: false,
      deltaAnalyzed: false,
      confidenceLevel: 50,
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: PremarketAnalysisFormData) => {
      const analysisData = {
        ...data,
        date: new Date().toISOString(),
      };
      
      return await apiRequest("/api/premarket-analysis", "POST", analysisData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Premarket analysis saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/premarket-analysis"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save premarket analysis",
        variant: "destructive",
      });
      console.error("Save error:", error);
    },
  });

  const onSubmit = (data: PremarketAnalysisFormData) => {
    saveAnalysisMutation.mutate(data);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    try {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    } catch (error) {
      console.error('Toggle section error:', error);
    }
  };

  const SectionHeader = ({ title, section }: { title: string; section: keyof typeof expandedSections }) => {
    const handleClick = React.useCallback((e: React.MouseEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        toggleSection(section);
      } catch (error) {
        console.error('Click error:', error);
        // Fallback: try direct state update
        setTimeout(() => {
          setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
          }));
        }, 0);
      }
    }, [section]);

    const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        toggleSection(section);
      } catch (error) {
        console.error('Touch error:', error);
        // Fallback for mobile
        setTimeout(() => {
          setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
          }));
        }, 0);
      }
    }, [section]);

    return (
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          minHeight: '44px', // Minimum touch target size
          padding: '8px 0'
        }}
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {expandedSections[section] ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6" style={{ touchAction: 'manipulation' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Premarket Analysis / Trade Planning</h2>
        <Button 
          onClick={() => onSubmit(form.getValues())}
          disabled={saveAnalysisMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Climate Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Climate" section="climate" />
            </CardHeader>
            {expandedSections.climate && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="climateNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">General thoughts about what's going on</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a general paragraph about anything that's going on..."
                          className="bg-gray-900 border-gray-600 text-white min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Economic Events Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Economic Events Calendar" section="economic" />
            </CardHeader>
            {expandedSections.economic && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasEconomicEvents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Any Economic Announcements, Events or Planned Meetings Today Regarding the President?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
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
                          <FormLabel className="text-white">Which ones?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List the specific economic events..."
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel className="text-white">How might this impact the market?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the potential market impact..."
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            )}
          </Card>

          {/* Futures Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Futures" section="futures" />
            </CardHeader>
            {expandedSections.futures && (
              <CardContent className="space-y-6">
                
                {/* ES Futures */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">ES</h4>
                  
                  <FormField
                    control={form.control}
                    name="esTradingNearLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 mb-4">
                        <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("esTradingNearLevel") && (
                    <FormField
                      control={form.control}
                      name="esLevelType"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel className="text-white">Which one?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Call Resistance">Call Resistance</SelectItem>
                              <SelectItem value="Put Support">Put Support</SelectItem>
                              <SelectItem value="HVL">HVL</SelectItem>
                              <SelectItem value="VWAP">VWAP</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="esVolumeRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Volume Analysis (1-100, 1 being low volume, 100 being high volume)</FormLabel>
                        <FormControl>
                          <div className="px-3">
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value || 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                              <span>1</span>
                              <span className="text-white font-medium">{field.value || 50}</span>
                              <span>100</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* NQ Futures */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">NQ</h4>
                  
                  <FormField
                    control={form.control}
                    name="nqTradingNearLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 mb-4">
                        <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("nqTradingNearLevel") && (
                    <FormField
                      control={form.control}
                      name="nqLevelType"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel className="text-white">Which one?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Call Resistance">Call Resistance</SelectItem>
                              <SelectItem value="Put Support">Put Support</SelectItem>
                              <SelectItem value="HVL">HVL</SelectItem>
                              <SelectItem value="VWAP">VWAP</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="nqVolumeRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Volume Analysis (1-100, 1 being low, 100 being high volume)</FormLabel>
                        <FormControl>
                          <div className="px-3">
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value || 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                              <span>1</span>
                              <span className="text-white font-medium">{field.value || 50}</span>
                              <span>100</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* RTY Futures */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">RTY</h4>
                  
                  <FormField
                    control={form.control}
                    name="rtyTradingNearLevel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 mb-4">
                        <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("rtyTradingNearLevel") && (
                    <FormField
                      control={form.control}
                      name="rtyLevelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Which one?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Call Resistance">Call Resistance</SelectItem>
                              <SelectItem value="Put Support">Put Support</SelectItem>
                              <SelectItem value="HVL">HVL</SelectItem>
                              <SelectItem value="VWAP">VWAP</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* SPY Analysis Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="SPY Analysis" section="spyAnalysis" />
            </CardHeader>
            {expandedSections.spyAnalysis && (
              <CardContent className="space-y-6">
                
                {/* Level Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="spyCallResistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Call Resistance</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spyPutSupport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Put Support</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spyHVL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">HVL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spyVaultLevels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Vault Levels</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spyVWAP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">VWAP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Trading Near Critical Level */}
                <FormField
                  control={form.control}
                  name="spyTradingNearLevel"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                      <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch("spyTradingNearLevel") && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="spyLevelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Which one?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Call Resistance">Call Resistance</SelectItem>
                              <SelectItem value="Put Support">Put Support</SelectItem>
                              <SelectItem value="HVL">HVL</SelectItem>
                              <SelectItem value="Vault Level">Vault Level</SelectItem>
                              <SelectItem value="VWAP">VWAP</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("spyLevelType") && (
                      <FormField
                        control={form.control}
                        name="spyDirection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">If selected, go long or short?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                  <SelectValue placeholder="Select direction" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Long">Long</SelectItem>
                                <SelectItem value="Short">Short</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* DPOF Section */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">DPOF</h4>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dpofTrend"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">What direction is it trending?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select trend direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Positive">Positive</SelectItem>
                              <SelectItem value="Negative">Negative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dpofVolumeDivergence"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600"
                              />
                            </FormControl>
                            <FormLabel className="text-white text-sm">Volume divergence?</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dpofAboveCenterline"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600"
                              />
                            </FormControl>
                            <FormLabel className="text-white text-sm">Above or below centerline?</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dpofExpansionDivergence"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600"
                              />
                            </FormControl>
                            <FormLabel className="text-white text-sm">Expansion divergence?</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dpofAbsorption"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600"
                              />
                            </FormControl>
                            <FormLabel className="text-white text-sm">Absorption?</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Volatility Assessment */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Volatility Assessment</h4>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="vixValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">What is the VIX value?</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter VIX value"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expectedVolatility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">How much volatility do you expect today? (1-100)</FormLabel>
                          <FormControl>
                            <div className="px-3">
                              <Slider
                                min={1}
                                max={100}
                                step={1}
                                value={[field.value || 50]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-gray-400 mt-1">
                                <span>1</span>
                                <span className="text-white font-medium">{field.value || 50}</span>
                                <span>100</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Volume Profile Gap Analysis */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Volume Profile Gap Analysis</h4>
                  
                  <FormField
                    control={form.control}
                    name="gapExists"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 mb-4">
                        <FormLabel className="text-white">Does a gap exist?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("gapExists") && (
                    <FormField
                      control={form.control}
                      name="gapRiskReward"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">What is the R:R</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter risk:reward ratio"
                              className="bg-gray-900 border-gray-600 text-white"
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

                {/* Gamma Exposure */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Gamma Exposure</h4>
                  
                  <FormField
                    control={form.control}
                    name="gammaEnvironment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Gamma Environment</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select gamma environment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Positive">Positive</SelectItem>
                            <SelectItem value="Negative">Negative</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("gammaEnvironment") === "Positive" && (
                    <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded">
                      <p className="text-blue-200 text-sm">
                        <strong>Reminder:</strong> Trading in a positive gamma environment results in a slow and steady step like fashion with risk of pinning.
                      </p>
                    </div>
                  )}
                  
                  {form.watch("gammaEnvironment") === "Negative" && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded">
                      <p className="text-red-200 text-sm">
                        <strong>Reminder:</strong> Trading in negative gamma environment is volatile and explosive.
                      </p>
                    </div>
                  )}
                </div>

                {/* Momentum */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Momentum</h4>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="squeezeMomoDirection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Squeeze Momo Direction</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Positive">Positive</SelectItem>
                              <SelectItem value="Negative">Negative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("squeezeMomoDirection") && (
                      <FormField
                        control={form.control}
                        name="inSqueeze"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={field.onChange}
                                className="border-gray-600"
                              />
                            </FormControl>
                            <FormLabel className="text-white text-sm">Is it in a squeeze?</FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Delta Exposure */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Delta Exposure</h4>
                  
                  <FormField
                    control={form.control}
                    name="deltaAnalyzed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3">
                        <FormLabel className="text-white">Analyzed?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Bond Market Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Bond Market" section="bondMarket" />
            </CardHeader>
            {expandedSections.bondMarket && (
              <CardContent>
                <FormField
                  control={form.control}
                  name="bondCorrelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">How are bonds trading in correlation to the underlying?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select bond correlation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Trending with SPY">Trending with SPY</SelectItem>
                          <SelectItem value="Trending inverse SPY">Trending inverse SPY</SelectItem>
                          <SelectItem value="No noticeable correlation">No noticeable correlation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Bias Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Bias" section="bias" />
            </CardHeader>
            {expandedSections.bias && (
              <CardContent>
                <FormField
                  control={form.control}
                  name="bias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Market Bias</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select market bias" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bullish">Bullish</SelectItem>
                          <SelectItem value="Bearish">Bearish</SelectItem>
                          <SelectItem value="Neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Trade Idea Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <SectionHeader title="Trade Idea" section="tradeIdea" />
            </CardHeader>
            {expandedSections.tradeIdea && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeIdeaTicker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Enter Ticker (e.g., SPY, QQQ)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SPY"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tradeIdeaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Calls/Puts</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Calls">Calls</SelectItem>
                            <SelectItem value="Puts">Puts</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tradeIdeaLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Off of what level?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter level"
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tradeIdeaRiskReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Enter Risk/Reward</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1:3"
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeIdeaTakeProfit1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Take Profit Level One</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tradeIdeaTakeProfit2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Take Profit Level Two</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="confidenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Confidence Level (1-100)</FormLabel>
                      <FormControl>
                        <div className="px-3">
                          <Slider
                            min={1}
                            max={100}
                            step={1}
                            value={[field.value || 50]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-400 mt-1">
                            <span>1</span>
                            <span className="text-white font-medium">{field.value || 50}%</span>
                            <span>100</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="positionSizing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Position Sizing</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select position sizing strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Scaling in">Scaling in</SelectItem>
                          <SelectItem value="Go in generously">Go in generously</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

        </form>
      </Form>
    </div>
  );
}