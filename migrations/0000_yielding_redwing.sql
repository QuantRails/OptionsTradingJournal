CREATE TABLE "intraday_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"time" timestamp NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premarket_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"climate_notes" text,
	"has_economic_events" boolean DEFAULT false,
	"economic_events" text,
	"economic_impact" text,
	"vix_value" real,
	"expected_volatility" integer,
	"gamma_environment" text,
	"bias" text,
	"es_futures_level" text,
	"es_futures_level_type" text,
	"es_volume_analysis" integer,
	"nq_futures_level" text,
	"nq_futures_level_type" text,
	"nq_volume_analysis" integer,
	"rty_futures_level" text,
	"rty_futures_level_type" text,
	"rty_volume_analysis" integer,
	"call_resistance" text,
	"put_support" text,
	"hvl_level" text,
	"vault_level" text,
	"vwap_level" text,
	"key_levels" text,
	"spy_critical_level" text,
	"spy_critical_level_type" text,
	"spy_direction" text,
	"dpof_trend" text,
	"dpof_volume_divergence" boolean DEFAULT false,
	"dpof_centerline" text,
	"dpof_expansion_divergence" boolean DEFAULT false,
	"dpof_absorption" boolean DEFAULT false,
	"volume_gap_exists" boolean DEFAULT false,
	"volume_gap_rr" text,
	"delta_exposure_analyzed" boolean DEFAULT false,
	"squeeze_momo_direction" text,
	"is_in_squeeze" boolean DEFAULT false,
	"bond_correlation" text,
	"trade_idea_1" text,
	"trade_idea_2" text,
	"trade_idea_3" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "trade_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"trade_id" integer NOT NULL,
	"screenshot_url" text,
	"what_went_well" text,
	"what_to_improve" text,
	"next_time" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"entry_price" real NOT NULL,
	"exit_price" real,
	"entry_time" timestamp NOT NULL,
	"exit_time" timestamp,
	"strike_price" real NOT NULL,
	"pnl" real,
	"entry_reason" text,
	"exit_reason" text,
	"playbook_id" integer,
	"time_classification" text,
	"trade_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
