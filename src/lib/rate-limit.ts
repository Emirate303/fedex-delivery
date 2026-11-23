import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type ShipmentRateLimitResult = {
  success: boolean;
  configured: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let shipmentLimiter: Ratelimit | null = null;

function getShipmentLimiter() {
  if (shipmentLimiter) {
    return shipmentLimiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({ url, token });

  shipmentLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "fedex-delivery:shipment",
    analytics: true,
  });

  return shipmentLimiter;
}

export async function checkShipmentRateLimit(
  request: NextRequest
): Promise<ShipmentRateLimitResult> {
  const limiter = getShipmentLimiter();

  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      configured: false,
      limit: 5,
      remaining: 0,
      reset: 0,
    };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "unknown";

  const result = await limiter.limit(`shipment-create:${ip}`);

  return {
    success: result.success,
    configured: true,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}