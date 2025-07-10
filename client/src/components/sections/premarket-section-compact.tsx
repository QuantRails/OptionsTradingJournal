import { useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertPremarketAnalysisSchema, type InsertPremarketAnalysis } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type PremarketFormData = z.infer<typeof insertPremarketAnalysisSchema>;

export default function PremarketSectionCompact() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    economic: false,
    vix: false,
    futures: false,
    spyAnalysis: false,
    dpofAnalysis: false,
    volumeGapAnalysis: false,
    volatilityAssessment: false,
    momentumAnalysis: false,
    bondMarketAnalysis: false,
    biasAnalysis: false,
    ideas: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const form = useForm<PremarketFormData>({
    resolver: zodResolver(insertPremarketAnalysisSchema),
    defaultValues: {
      date: today,
      climateNotes: "",
      hasEconomicEvents: false,
      economicEvents: "",
      economicImpact: "low",
      vixValue: undefined,
      expectedVolatility: 50,
      gammaEnvironment: "neutral",
      bias: "neutral",
      esFuturesLevel: "",
      esFuturesLevelType: "other",
      esVolumeAnalysis: 50,
      nqFuturesLevel: "",
      nqFuturesLevelType: "other", 
      nqVolumeAnalysis: 50,
      rtyFuturesLevel: "",
      rtyFuturesLevelType: "other",
      rtyVolumeAnalysis: 50,
      callResistance: "",
      putSupport: "",
      hvlLevel: "",
      vaultLevel: "",
      spyAnalysis: "",
      keyLevels: "",
      volumeGapExists: false,
      volumeGapRR: "",
      dpofTrend: "positive",
      dpofVolumeDivergence: false,
      dpofCenterline: "above",
      dpofExpansionDivergence: false,
      dpofAbsorption: false,
      deltaExposureAnalyzed: false,
      squeezeMomoDirection: "positive",
      isInSqueeze: false,
      bondCorrelation: "no_correlation",
      tradeIdea1: "",
      tradeIdea2: "",
      tradeIdea3: "",
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (data: PremarketFormData) => {
      const response = await fetch("/api/premarket-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save analysis");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Premarket analysis saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/premarket-analysis"] });
    },
    onError: (error) => {
      toast({ title: "Error saving analysis", description: String(error), variant: "destructive" });
    },
  });

  const onSubmit = (data: PremarketFormData) => {
    saveAnalysisMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Market Overview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-750"
              onClick={() => toggleSection('overview')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Market Overview</CardTitle>
                <div className="text-white">
                  {expandedSections.overview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.overview && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="climateNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Market Climate</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Overall market sentiment, key themes..."
                          className="bg-gray-900 border-gray-600 text-white min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Market Bias</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select bias" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bullish">Bullish</SelectItem>
                            <SelectItem value="bearish">Bearish</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gammaEnvironment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Gamma Environment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select gamma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Economic Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-750"
              onClick={() => toggleSection('economic')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Economic Events</CardTitle>
                <div className="text-white">
                  {expandedSections.economic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.economic && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasEconomicEvents"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-3">
                      <FormLabel className="text-white">Economic Events Today?</FormLabel>
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
                          <FormLabel className="text-white">Event Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="CPI, FOMC, Employment data..."
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
                          <FormLabel className="text-white">Expected Impact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                <SelectValue placeholder="Select impact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
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

          {/* VIX Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-750"
              onClick={() => toggleSection('vix')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">VIX & Volatility</CardTitle>
                <div className="text-white">
                  {expandedSections.vix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.vix && (
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vixValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">VIX Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="18.5"
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
                      <FormLabel className="text-white">Expected Vol (1-100)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="50"
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Futures Levels */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Futures Levels</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('futures')}
                  className="text-white hover:bg-gray-700"
                >
                  {expandedSections.futures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.futures && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="esFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">ES Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="5820"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="esVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Vol %"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="nqFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">NQ Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="20150"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nqVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Vol %"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="rtyFuturesLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">RTY Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2180"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rtyVolumeAnalysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="Vol %"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* SPY Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-750"
              onClick={() => toggleSection('spyAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">SPY Analysis</CardTitle>
                <div className="text-white">
                  {expandedSections.spyAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.spyAnalysis && (
              <CardContent className="space-y-6">
                {/* Gamma Exposure */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Gamma Exposure</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="callResistance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Call Resistance</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="585, 590"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="putSupport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Put Support</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="580, 575"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Volume Profile */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Volume Profile</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hvlLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">HVL Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="582.50"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vaultLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white text-sm">Vault Level</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="578.25"
                              className="bg-gray-900 border-gray-600 text-white"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Key Levels Analysis */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Key Levels</h4>
                  <FormField
                    control={form.control}
                    name="keyLevels"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Support: 580, 578 | Resistance: 585, 590 | Levels to watch..."
                            className="bg-gray-900 border-gray-600 text-white min-h-[60px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* TradingView Parser */}
                  <div className="space-y-2">
                    <FormControl>
                      <Input
                        placeholder="Paste TradingView levels here..."
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      Parse and Copy
                    </Button>
                  </div>
                </div>

                {/* Momentum Analysis */}
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Momentum Analysis</h4>
                  <FormField
                    control={form.control}
                    name="spyAnalysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Momentum direction, volume analysis, key inflection points..."
                            className="bg-gray-900 border-gray-600 text-white min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* DPOF Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('dpofAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">DPOF Analysis</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.dpofAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.dpofAnalysis && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dpofTrend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Trend Direction</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select trend" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dpofCenterline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Centerline Position</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Above/Below" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="above">Above</SelectItem>
                            <SelectItem value="below">Below</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dpofVolumeDivergence"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="border-gray-600"
                          />
                        </FormControl>
                        <FormLabel className="text-white text-sm">Volume Divergence</FormLabel>
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
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="border-gray-600"
                          />
                        </FormControl>
                        <FormLabel className="text-white text-sm">Expansion Divergence</FormLabel>
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
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="border-gray-600"
                          />
                        </FormControl>
                        <FormLabel className="text-white text-sm">Absorption</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Volume Profile Gap Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('volumeGapAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Volume Profile Gap Analysis</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.volumeGapAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.volumeGapAnalysis && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="volumeGapExists"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          className="border-gray-600"
                        />
                      </FormControl>
                      <FormLabel className="text-white">Gap Exists</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volumeGapRR"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Risk/Reward Analysis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Risk/reward ratio analysis..."
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Volatility Assessment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('volatilityAssessment')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Volatility Assessment</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.volatilityAssessment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.volatilityAssessment && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vixValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">VIX Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="22.50"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedVolatility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Expected Volatility (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="50"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gammaEnvironment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Gamma Environment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="positive">Positive (Slow, steady, risk of pinning)</SelectItem>
                          <SelectItem value="negative">Negative (Volatile, explosive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deltaExposureAnalyzed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          className="border-gray-600"
                        />
                      </FormControl>
                      <FormLabel className="text-white">Delta Exposure Analyzed</FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Momentum Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('momentumAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Momentum Analysis</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.momentumAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.momentumAnalysis && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="squeezeMomoDirection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Squeeze Momentum Direction</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isInSqueeze"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="border-gray-600"
                          />
                        </FormControl>
                        <FormLabel className="text-white">In Squeeze</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Bond Market Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('bondMarketAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Bond Market Analysis</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.bondMarketAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.bondMarketAnalysis && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bondCorrelation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Bond Correlation to SPY</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select correlation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trending_with">Trending with SPY</SelectItem>
                          <SelectItem value="trending_inverse">Trending inverse SPY</SelectItem>
                          <SelectItem value="no_correlation">No noticeable correlation</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Bias */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleSection('biasAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Market Bias</CardTitle>
                <div className="flex items-center space-x-2">
                  {expandedSections.biasAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.biasAnalysis && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Overall Market Bias</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                            <SelectValue placeholder="Select bias" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bullish">Bullish</SelectItem>
                          <SelectItem value="bearish">Bearish</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Trade Ideas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Trade Ideas</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('ideas')}
                  className="text-white hover:bg-gray-700"
                >
                  {expandedSections.ideas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.ideas && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tradeIdea1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Idea #1</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Setup, entry, target..."
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tradeIdea2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Idea #2</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Setup, entry, target..."
                          className="bg-gray-900 border-gray-600 text-white"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
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
              {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}