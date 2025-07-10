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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Save, Cloud, TrendingUp, BarChart3, Target, DollarSign, AlertTriangle, Copy, ChevronDown, ChevronUp, Zap, LineChart, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPremarketAnalysisSchema, type PremarketAnalysis } from "@shared/schema";
import { useAutoSave } from "@/hooks/use-autosave";

const premarketFormSchema = insertPremarketAnalysisSchema.extend({
  date: z.date(),
});

type PremarketFormData = z.infer<typeof premarketFormSchema>;

export default function PremarketSection() {
  const [levelsString, setLevelsString] = useState("");
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedSections, setExpandedSections] = useState({
    climate: false,
    economic: false,
    vix: false,
    spyAnalysis: true,
    futures: false,
    volatility: false,
    watchlist: false,
    tradeIdeas: false,
    gammaExposure: false,
    momentum: false,
    bondMarket: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigate to previous trading day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  // Navigate to next trading day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Fetch premarket analysis for selected date
  const { data: existingAnalysis, isLoading } = useQuery<PremarketAnalysis>({
    queryKey: ["/api/premarket-analysis/date", format(selectedDate, "yyyy-MM-dd")],
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
      date: selectedDate,
      climateNotes: "",
      hasEconomicEvents: false,
      economicEvents: "",
      economicImpact: "",
      vixValue: undefined,
      expectedVolatility: undefined,
      gammaEnvironment: "",
      bias: "",
      esFuturesLevel: "",
      esFuturesLevelType: "",
      esVolumeAnalysis: undefined,
      nqFuturesLevel: "",
      nqFuturesLevelType: "",
      nqVolumeAnalysis: undefined,
      rtyFuturesLevel: existingAnalysis?.rtyFuturesLevel || "",
      rtyFuturesLevelType: existingAnalysis?.rtyFuturesLevelType || "",
      rtyVolumeAnalysis: existingAnalysis?.rtyVolumeAnalysis || undefined,
      callResistance: existingAnalysis?.callResistance || "",
      putSupport: existingAnalysis?.putSupport || "",
      hvlLevel: existingAnalysis?.hvlLevel || "",
      vaultLevel: existingAnalysis?.vaultLevel || "",
      vwapLevel: existingAnalysis?.vwapLevel || "",
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

  // Sync form with existing analysis when date or data changes
  React.useEffect(() => {
    if (existingAnalysis) {
      // Populate form with existing data
      Object.keys(existingAnalysis).forEach((key) => {
        const value = existingAnalysis[key as keyof PremarketAnalysis];
        if (value !== null && value !== undefined) {
          form.setValue(key as any, value);
        }
      });
      form.setValue('date', selectedDate);
    } else {
      // Reset form for new entry
      form.reset({
        date: selectedDate,
        climateNotes: "",
        hasEconomicEvents: false,
        economicEvents: "",
        economicImpact: "",
        vixValue: undefined,
        expectedVolatility: undefined,
        gammaEnvironment: "",
        bias: "",
        esFuturesLevel: "",
        esFuturesLevelType: "",
        esVolumeAnalysis: undefined,
        nqFuturesLevel: "",
        nqFuturesLevelType: "",
        nqVolumeAnalysis: undefined,
        rtyFuturesLevel: "",
        rtyFuturesLevelType: "",
        rtyVolumeAnalysis: undefined,
        callResistance: "",
        putSupport: "",
        hvlLevel: "",
        gammaFlipLevel: "",
        maxPainLevel: "",
        gdelLevel: "",
        watchlistTickers: "",
        tradeIdeas: "",
        momentumTickers: "",
        bondYield10y: undefined,
        bondYield2y: undefined,
        yieldSpread: undefined,
        isInSqueeze: false,
        bondCorrelation: "",
      });
    }
  }, [existingAnalysis, selectedDate, form]);

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

  // Parse levels string function
  const parseLevelsString = () => {
    if (!levelsString.trim()) return;
    
    try {
      // Expected format: "Call Resistance, 601, Put Support, 600, HVL, 601, Gamma Flip, 514, Max Pain, 599, GDEL, 600, HPSG, 600, OFLO, 600"
      const parts = levelsString.split(',').map(s => s.trim());
      
      for (let i = 0; i < parts.length; i += 2) {
        const label = parts[i]?.toLowerCase();
        const value = parseFloat(parts[i + 1]);
        
        if (isNaN(value)) continue;
        
        if (label?.includes('call resistance')) {
          form.setValue('callResistance', value.toString());
        } else if (label?.includes('put support')) {
          form.setValue('putSupport', value.toString());
        } else if (label?.includes('hvl')) {
          form.setValue('hvlLevel', value.toString());
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Premarket Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Complete market preparation for {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Market Analysis</h2>
          <p className="text-muted-foreground">
            {existingAnalysis ? "Editing existing analysis" : "Creating new analysis"}
          </p>
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit as any)}
          disabled={saveAnalysisMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveAnalysisMutation.isPending ? "Saving..." : "Save Analysis"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          {/* Market Climate */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Cloud className="mr-2 h-5 w-5 text-blue-400" />
                  Market Climate
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('climate')}
                  className="text-white hover:bg-gray-700"
                >
                  {expandedSections.climate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.climate && (
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

          {/* Economic Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" />
                  Economic Events Calendar
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('economic')}
                  className="text-white hover:bg-gray-700"
                >
                  {expandedSections.economic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
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
                        Economic Announcements Today?
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Any economic events, announcements, or presidential meetings scheduled?
                      </div>
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
                        <FormLabel className="text-white">Which Events?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List the specific economic events, announcements, or meetings..."
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
                        <FormLabel className="text-white">Market Impact Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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

          {/* VIX & Market Environment */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                  VIX & Market Environment
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('vix')}
                  className="text-white hover:bg-gray-700"
                >
                  {expandedSections.vix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.vix && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="e.g., 20.5"
                        className="bg-gray-900 border-gray-600 text-white"
                        {...field}
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
                name="expectedVolatility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Expected Volatility (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g., 75"
                        className="bg-gray-900 border-gray-600 text-white"
                        {...field}
                            value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                          <SelectValue placeholder="Select gamma environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="positive">Positive Gamma</SelectItem>
                        <SelectItem value="negative">Negative Gamma</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Market Bias</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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

          {/* Futures Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('futures')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                  Futures Analysis
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.futures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.futures && (
            <CardContent className="space-y-6">
              {/* ES Futures */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Badge variant="outline" className="mr-2">ES</Badge>
                  E-mini S&P 500
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="esFuturesLevelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Critical Level Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                    name="esFuturesLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Level Value</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 4500"
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
                    name="esVolumeAnalysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Volume Analysis (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="e.g., 70"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Badge variant="outline" className="mr-2">NQ</Badge>
                  E-mini NASDAQ-100
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nqFuturesLevelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Critical Level Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                    name="nqFuturesLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Level Value</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 16000"
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
                    name="nqVolumeAnalysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Volume Analysis (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="e.g., 60"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Badge variant="outline" className="mr-2">RTY</Badge>
                  E-mini Russell 2000
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="rtyFuturesLevelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Critical Level Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                    name="rtyFuturesLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Level Value</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 2100"
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
                    name="rtyVolumeAnalysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Volume Analysis (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="e.g., 50"
                            className="bg-gray-900 border-gray-600 text-white"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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

          {/* SPY Key Levels Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('spyAnalysis')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Target className="mr-2 h-5 w-5 text-red-400" />
                  SPY Key Levels Analysis
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.spyAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.spyAnalysis && (
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
                          {...field}
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
                          {...field}
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
                          {...field}
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
                          {...field}
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
                          {...field}
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
                  <DollarSign className="mr-2 h-5 w-5 text-blue-400" />
                  SPY Analysis
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.spyAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.spyAnalysis && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="spyCriticalLevelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Trading Near Critical Level?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                  name="spyDirection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Direction Bias</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                          checked={!!field.value}
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
                          checked={!!field.value}
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

          {/* Volume Gap Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => toggleSection('volatility')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Volume Profile Gap Analysis</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.volatility ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.volatility && (
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
                        checked={!!field.value}
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
                          {...field}
                            value={field.value || ""}
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
                <CardTitle className="text-white">Trade Ideas</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.tradeIdeas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedSections.tradeIdeas && (
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
                name="tradeIdea2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Trade Idea #2</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your second trade idea, setup, and rationale..."
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
                name="tradeIdea3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Trade Idea #3</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your third trade idea, setup, and rationale..."
                        className="bg-gray-900 border-gray-600 text-white"
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.gammaExposure ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                        checked={!!field.value}
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
                  <TrendingUp className="mr-2 h-5 w-5 text-purple-400" />
                  Momentum Analysis
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.momentum ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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
                        checked={!!field.value}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 pointer-events-none"
                >
                  {expandedSections.bondMarket ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
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