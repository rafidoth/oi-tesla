CREATE TABLE "ride_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"pool_id" uuid,
	"passenger_ride_id" uuid,
	"ride_request_id" uuid,
	"from_state" text,
	"to_state" text,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_events_actor_type_check" CHECK ("ride_events"."actor_type" IN ('PASSENGER','DRIVER','SYSTEM'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_check" CHECK ("users"."role" IN ('PASSENGER', 'DRIVER'))
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"name" text NOT NULL,
	"reg_no" text NOT NULL,
	"capacity" integer NOT NULL,
	"status" text DEFAULT 'OFFLINE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_driver_id_unique" UNIQUE("driver_id"),
	CONSTRAINT "vehicles_reg_no_unique" UNIQUE("reg_no"),
	CONSTRAINT "vehicle_capacity_check" CHECK ("vehicles"."capacity" BETWEEN 1 AND 6),
	CONSTRAINT "vehicle_status_check" CHECK ("vehicles"."status" IN ('ONLINE', 'OFFLINE'))
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "route_segments" (
	"route_id" integer NOT NULL,
	"from_location_id" integer NOT NULL,
	"to_location_id" integer NOT NULL,
	"distance_m" integer NOT NULL,
	CONSTRAINT "route_segments_route_id_from_location_id_to_location_id_pk" PRIMARY KEY("route_id","from_location_id","to_location_id"),
	CONSTRAINT "route_segment_distance_check" CHECK ("route_segments"."distance_m" > 0)
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"route_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "route_stops_route_id_position_pk" PRIMARY KEY("route_id","position"),
	CONSTRAINT "route_stops_route_id_location_id_unique" UNIQUE("route_id","location_id"),
	CONSTRAINT "route_stop_position_check" CHECK ("route_stops"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "routes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "routes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pickup_location_id" integer NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"driver_id" uuid,
	"vehicle_id" uuid,
	"capacity" integer NOT NULL,
	"occupied_seats" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_status_check" CHECK ("pools"."status" IN ('OPEN','MATCHED','DRIVER_ARRIVED','STARTED','COMPLETED','CANCELLED')),
	CONSTRAINT "pool_capacity_check" CHECK ("pools"."capacity" BETWEEN 1 AND 6),
	CONSTRAINT "pool_occupied_seats_check" CHECK ("pools"."occupied_seats" BETWEEN 0 AND "pools"."capacity")
);
--> statement-breakpoint
CREATE TABLE "passenger_rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_request_id" uuid NOT NULL,
	"passenger_id" uuid NOT NULL,
	"pool_id" uuid NOT NULL,
	"seats" integer NOT NULL,
	"fare_paisa" bigint,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passenger_rides_ride_request_id_unique" UNIQUE("ride_request_id"),
	CONSTRAINT "passenger_rides_seats_check" CHECK ("passenger_rides"."seats" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "ride_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passenger_id" uuid NOT NULL,
	"pickup_location_id" integer NOT NULL,
	"dest_location_id" integer NOT NULL,
	"seats" integer NOT NULL,
	"payment_method" text DEFAULT 'CASH' NOT NULL,
	"estimate_fare_paisa" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_requests_pickup_dest_check" CHECK ("ride_requests"."pickup_location_id" <> "ride_requests"."dest_location_id"),
	CONSTRAINT "ride_requests_seats_check" CHECK ("ride_requests"."seats" BETWEEN 1 AND 4),
	CONSTRAINT "ride_requests_payment_method_check" CHECK ("ride_requests"."payment_method" IN ('CASH','TESLAPAY'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passenger_ride_id" uuid NOT NULL,
	"method" text NOT NULL,
	"amount_paisa" bigint NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_passenger_ride_id_unique" UNIQUE("passenger_ride_id"),
	CONSTRAINT "payments_method_check" CHECK ("payments"."method" IN ('CASH','TESLAPAY')),
	CONSTRAINT "payments_amount_paisa_check" CHECK ("payments"."amount_paisa" > 0),
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" IN ('PENDING','PAID','FAILED'))
);
--> statement-breakpoint
CREATE TABLE "system_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"booted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_passenger_ride_id_passenger_rides_id_fk" FOREIGN KEY ("passenger_ride_id") REFERENCES "public"."passenger_rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_ride_request_id_ride_requests_id_fk" FOREIGN KEY ("ride_request_id") REFERENCES "public"."ride_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passenger_rides" ADD CONSTRAINT "passenger_rides_ride_request_id_ride_requests_id_fk" FOREIGN KEY ("ride_request_id") REFERENCES "public"."ride_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passenger_rides" ADD CONSTRAINT "passenger_rides_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passenger_rides" ADD CONSTRAINT "passenger_rides_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_dest_location_id_locations_id_fk" FOREIGN KEY ("dest_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_passenger_ride_id_passenger_rides_id_fk" FOREIGN KEY ("passenger_ride_id") REFERENCES "public"."passenger_rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_events_pool_id_idx" ON "ride_events" USING btree ("pool_id","id");--> statement-breakpoint
CREATE INDEX "ride_events_passenger_ride_id_idx" ON "ride_events" USING btree ("passenger_ride_id","id");--> statement-breakpoint
CREATE INDEX "ride_events_ride_request_id_idx" ON "ride_events" USING btree ("ride_request_id","id");--> statement-breakpoint
CREATE INDEX "ride_events_occurred_at_idx" ON "ride_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "pools_status_pickup_location_idx" ON "pools" USING btree ("status","pickup_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pools_driver_active_unique_idx" ON "pools" USING btree ("driver_id") WHERE "pools"."status" IN ('MATCHED','DRIVER_ARRIVED','STARTED');--> statement-breakpoint
CREATE INDEX "pools_created_at_idx" ON "pools" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "passenger_rides_pool_passenger_unique_idx" ON "passenger_rides" USING btree ("pool_id","passenger_id") WHERE "passenger_rides"."cancelled_at" IS NULL;--> statement-breakpoint
CREATE INDEX "passenger_rides_passenger_created_at_idx" ON "passenger_rides" USING btree ("passenger_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "passenger_rides_pool_idx" ON "passenger_rides" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "ride_requests_passenger_created_at_idx" ON "ride_requests" USING btree ("passenger_id","created_at" DESC NULLS LAST);