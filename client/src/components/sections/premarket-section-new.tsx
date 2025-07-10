import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, Cloud, Calendar, BarChart3, TrendingUp, Target, DollarSign, 
  AlertTriangle, ChevronDown, ChevronUp, Zap, LineChart, Activity,
  TrendingDown, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPremarketAnalysisSchema, type PremarketAnalysis } from "@shared/schema";
import { useAutoSave } from "@/hooks/use-autosave";

const premarketFormSchema = insertPremarketAnalysisSchema.extend({
  date: z.date(),
});

type PremarketFormData = z.infer<typeof premarketFormSchema>;

export default function PremarketSectionNew() {
  const { toast } = useToast();
  const today = new Date();
  
  const [expandedSections, setExpandedSections] = useState({
    climate: false,
    economic: false,
    vix: false,
    futures: false,
    keyLevels: false,
    spyAnalysis: true,
    gammaExposure: false,
    momentum: false,
    bondMarket: false,
    volumeGap: false,
    tradeIdeas: false,
  });

  // Parse TradingView string for SPY levels
  const [levelsString, setLevelsString] = useState("Call Resistance, 600, Put Support, 550, HVL, 601, Gamma Flip, 577, Max Pain, 505, GDEL, 550, HPSG, 610, OFLO, 605");

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch today's premarket analysis
  const { data: existingAnalysis, isLoading } = useQuery<PremarketAnalysis>({
    queryKey: ["/api/premarket-analysis/today"],
  });

  // Create/Update mutation
  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: PremarketFormData) => {
      if (existingAnalysis) {
        return apiRequest(`/api/premarket-analysis/${existingAnalysis.id}`, "PATCH", data);
      }
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

  const form = useForm<PremarketFormData>({
    resolver: zodResolver(premarketFormSchema),
    defaultValues: {
      date: today,
      climateNotes: existingAnalysis?.climateNotes || "",
      hasEconomicEvents: existingAnalysis?.hasEconomicEvents || false,
      economicEvents: existingAnalysis?.economicEvents || "",
      economicImpact: existingAnalysis?.economicImpact || "low",
      vixValue: existingAnalysis?.vixValue || undefined,
      expectedVolatility: existingAnalysis?.expectedVolatility || 50,
      gammaEnvironment: existingAnalysis?.gammaEnvironment || "neutral",
      bias: existingAnalysis?.bias || "neutral",
      esFuturesLevel: existingAnalysis?.esFuturesLevel || "",
      esFuturesLevelType: existingAnalysis?.esFuturesLevelType || "other",
      esVolumeAnalysis: existingAnalysis?.esVolumeAnalysis || 50,
      nqFuturesLevel: existingAnalysis?.nqFuturesLevel || "",
      nqFuturesLevelType: existingAnalysis?.nqFuturesLevelType || "other",
      nqVolumeAnalysis: existingAnalysis?.nqVolumeAnalysis || 50,
      rtyFuturesLevel: existingAnalysis?.rtyFuturesLevel || "",
      rtyFuturesLevelType: existingAnalysis?.rtyFuturesLevelType || "other",
      rtyVolumeAnalysis: existingAnalysis?.rtyVolumeAnalysis || 50,
      callResistance: existingAnalysis?.callResistance || undefined,
      putSupport: existingAnalysis?.putSupport || undefined,
      hvlLevel: existingAnalysis?.hvlLevel || undefined,
      vaultLevel: existingAnalysis?.vaultLevel || undefined,
      vwapLevel: existingAnalysis?.vwapLevel || undefined,
      spyCriticalLevel: existingAnalysis?.spyCriticalLevel || "",
      spyCriticalLevelType: existingAnalysis?.spyCriticalLevelType || "",
      spyDirection: existingAnalysis?.spyDirection || "",
      dpofTrend: existingAnalysis?.dpofTrend || "",
      dpofVolumeDivergence: existingAnalysis?.dpofVolumeDivergence || false,
      dpofCenterline: existingAnalysis?.dpofCenterline || "",
      dpofExpansionDivergence: existingAnalysis?.dpofExpansionDivergence || false,
      dpofAbsorption: existingAnalysis?.dpofAbsorption || false,
      volumeGapExists: existingAnalysis?.volumeGapExists || false,
      volumeGapRR: existingAnalysis?.volumeGapRR || "",
      tradeIdea1: existingAnalysis?.tradeIdea1 || "",
      tradeIdea2: existingAnalysis?.tradeIdea2 || "",
      tradeIdea3: existingAnalysis?.tradeIdea3 || "",
      deltaExposureAnalyzed: existingAnalysis?.deltaExposureAnalyzed || false,
      squeezeMomoDirection: existingAnalysis?.squeezeMomoDirection || "",
      isInSqueeze: existingAnalysis?.isInSqueeze || false,
      bondCorrelation: existingAnalysis?.bondCorrelation || "",
    },
  });

  // Auto-save functionality
  const formData = form.watch();
  useAutoSave(formData, (data) => {
    if (Object.values(data).some(value => value !== "" && value !== undefined && value !== false)) {
      saveAnalysisMutation.mutate(data);
    }
  }, 3000);

  const onSubmit = (data: PremarketFormData) => {
    saveAnalysisMutation.mutate(data);
  };

  // Parse TradingView levels string
  const parseLevels = () => {
    const pairs = levelsString.split(',').map(s => s.trim());
    const levels: Record<string, number> = {};
    for (let i = 0; i < pairs.length; i += 2) {
      if (pairs[i] && pairs[i + 1]) {
        const key = pairs[i].toLowerCase().replace(/\s+/g, '');
        const value = parseFloat(pairs[i + 1]);
        if (!isNaN(value)) {
          levels[key] = value;
        }
      }
    }
    return levels;
  };

  const copyParsedLevels = () => {
    const levels = parseLevels();
    if (levels.callresistance) form.setValue('callResistance', levels.callresistance.toString());
    if (levels.putsupport) form.setValue('putSupport', levels.putsupport.toString());
    if (levels.hvl) form.setValue('hvlLevel', levels.hvl.toString());
    if (levels.gammaflip) form.setValue('vaultLevel', levels.gammaflip.toString());
    toast({
      title: "Levels copied",
      description: "TradingView levels have been parsed and copied to the form.",
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="text-white">Loading premarket analysis...</div>
    </div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Premarket Analysis</h1>
        <Badge variant="outline" className="text-white border-white">
          {today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Market Climate */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('climate')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Cloud className="mr-2 h-5 w-5 text-blue-400" />
                  Market Climate
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.climate ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.climate && (
              <CardContent className="space-y-4">
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
            )}
          </Card>

          {/* Economic Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('economic')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-yellow-400" />
                  Economic Events
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.economic ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.economic && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasEconomicEvents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Any Economic Announcements, Events or Planned Meetings Today?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
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
                              placeholder="List the economic events and their scheduled times..."
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
                          <FormLabel className="text-white">How might this impact the market?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
            )}
          </Card>

          {/* VIX & Volatility Assessment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('vix')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                  VIX & Volatility Assessment
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.vix ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.vix && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vixValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What is the VIX value?</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 18.50"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        <FormLabel className="text-white">How much volatility do you expect today? ({field.value}%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={100}
                            step={1}
                            value={[field.value || 50]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Futures Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('futures')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                  Futures Levels
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.futures ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.futures && (
              <CardContent className="space-y-6">
                {/* ES Futures */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">ES (S&P 500)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="esFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 5820"
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
                      name="esFuturesLevelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-900 border-gray-600">
                              <SelectItem value="call_resistance">Call Resistance</SelectItem>
                              <SelectItem value="put_support">Put Support</SelectItem>
                              <SelectItem value="hvl">HVL</SelectItem>
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
                      name="esVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Volume Analysis (1-100): {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value || 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                {/* NQ Futures */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">NQ (NASDAQ)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nqFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 20150"
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
                      name="nqFuturesLevelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-900 border-gray-600">
                              <SelectItem value="call_resistance">Call Resistance</SelectItem>
                              <SelectItem value="put_support">Put Support</SelectItem>
                              <SelectItem value="hvl">HVL</SelectItem>
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
                      name="nqVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Volume Analysis (1-100): {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value || 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                {/* RTY Futures */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">RTY (Russell 2000)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="rtyFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 2180"
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
                      name="rtyFuturesLevelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select level type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-900 border-gray-600">
                              <SelectItem value="call_resistance">Call Resistance</SelectItem>
                              <SelectItem value="put_support">Put Support</SelectItem>
                              <SelectItem value="hvl">HVL</SelectItem>
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
                      name="rtyVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Volume Analysis (1-100): {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              value={[field.value || 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Key Levels Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('keyLevels')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5 text-red-400" />
                  Key Levels Analysis
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.keyLevels ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.keyLevels && (
              <CardContent className="space-y-6">
                {/* TradingView String Parser */}
                <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">TradingView Levels Parser</h4>
                    <Button 
                      type="button" 
                      onClick={copyParsedLevels}
                      variant="outline" 
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-black"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Parse & Copy
                    </Button>
                  </div>
                  <Textarea
                    value={levelsString}
                    onChange={(e) => setLevelsString(e.target.value)}
                    placeholder="Call Resistance, 600, Put Support, 550, HVL, 601, Gamma Flip, 577, Max Pain, 505, GDEL, 550, HPSG, 610, OFLO, 605"
                    className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Format: Label, Value, Label, Value... (e.g., "Call Resistance, 600, Put Support, 550")
                  </p>
                </div>

                <Separator className="bg-gray-600" />

                {/* Manual Level Entry */}
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
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        <FormLabel className="text-white">HVL</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        <FormLabel className="text-white">Vault Levels</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        <FormLabel className="text-white">VWAP</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter value"
                            className="bg-gray-900 border-gray-600 text-white"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* SPY Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('spyAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-400" />
                  SPY Analysis
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.spyAnalysis ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.spyAnalysis && (
              <CardContent className="space-y-6">
                {/* SPY Critical Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spyCriticalLevelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Trading near a critical level?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select level type" />
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
                    name="spyDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">If selected, go long or short?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select direction" />
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

                <Separator className="bg-gray-600" />

                {/* DPOF Analysis */}
                <h4 className="text-lg font-semibold text-white">DPOF Analysis</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dpofTrend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">What direction is it trending?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                        <FormLabel className="text-white">Above or below centerline?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-600">
                            <SelectItem value="above">Above</SelectItem>
                            <SelectItem value="below">Below</SelectItem>
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
                          <FormLabel className="text-white">Volume divergence?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
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
                          <FormLabel className="text-white">Expansion divergence?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
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
                          <FormLabel className="text-white">Absorption?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-gray-600" />

                {/* Market Bias */}
                <FormField
                  control={form.control}
                  name="bias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Market Bias</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select market bias" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="bullish">Bullish</SelectItem>
                          <SelectItem value="bearish">Bearish</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* SPY Gamma Exposure */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('gammaExposure')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-yellow-400" />
                  SPY Gamma Exposure
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.gammaExposure ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.gammaExposure && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="gammaEnvironment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Gamma Environment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select gamma environment" />
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
                
                {form.watch("gammaEnvironment") === "positive" && (
                  <Alert className="border-green-600 bg-green-900/20">
                    <AlertTriangle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      Trading in a positive gamma environment results in a slow and steady step-like fashion with risk of pinning.
                    </AlertDescription>
                  </Alert>
                )}
                
                {form.watch("gammaEnvironment") === "negative" && (
                  <Alert className="border-red-600 bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      Trading in negative gamma environment is volatile and explosive.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="deltaExposureAnalyzed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Delta Exposure Analyzed?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Momentum Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('momentum')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-purple-400" />
                  Momentum Analysis
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.momentum ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.momentum && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="squeezeMomoDirection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Squeeze Momentum Direction</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select momentum direction" />
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
                  name="isInSqueeze"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Is it in a squeeze?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Bond Market Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('bondMarket')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <LineChart className="mr-2 h-5 w-5 text-blue-400" />
                  Bond Market Analysis
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.bondMarket ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.bondMarket && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bondCorrelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">How are bonds trading in correlation to the underlying?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select bond correlation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          <SelectItem value="trending_with">Trending with SPY</SelectItem>
                          <SelectItem value="trending_inverse">Trending inverse SPY</SelectItem>
                          <SelectItem value="no_correlation">No noticeable correlation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Volume Profile Gap Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('volumeGap')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-orange-400" />
                  Volume Profile Gap Analysis
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.volumeGap ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.volumeGap && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="volumeGapExists"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Does a gap exist?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
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
                        <FormLabel className="text-white">What is the R:R?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the risk/reward ratio and gap details..."
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
            )}
          </Card>

          {/* Trade Ideas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('tradeIdeas')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5 text-cyan-400" />
                  Trade Ideas
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${expandedSections.tradeIdeas ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.tradeIdeas && (
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Enter ticker (SPY, QQQ, etc.) with specific levels, calls/puts, confidence level, and position sizing strategy.
                </p>
                
                <FormField
                  control={form.control}
                  name="tradeIdea1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Trade Idea #1</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., SPY 580C off HVL support, 1:3 R:R targeting 582.50, take profit level one at 581.25, level two at 582.50"
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
                          placeholder="e.g., QQQ puts off call resistance at 503, targeting gap fill at 501, scaling in position"
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
                          placeholder="e.g., IWM calls off put support at 218, go in generously, targeting HVL at 220"
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
            )}
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