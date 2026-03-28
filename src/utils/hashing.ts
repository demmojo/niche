import stringHash from "string-hash";
import { createClient } from "@supabase/supabase-js";
import { auth } from "../firebase";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize supabase only if URL and key are provided
export const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          },
        },
        /**
         *
         */
        accessToken: async () => {
          // Automatically inject the Firebase JWT into Supabase requests
          return (await auth.currentUser?.getIdToken(false)) ?? "";
        },
      })
    : null;

// SimHash constants
const HASH_BITS = 32;

/**
 * Calculates SHA-256 for exact matching (JSON/Binary)
 */
export const calculateExactHash = async (data: any): Promise<string> => {
  const normalized =
    typeof data === "object" ? JSON.stringify(data) : String(data);
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

/**
 * Simple tokenization for text SimHash
 */
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 0);
};

/**
 * Calculates SimHash for text-based near-duplicate detection
 * Uses 32-bit hashes for simplicity, sufficient for basic near-dup checking.
 */
export const calculateSimHash = (text: string): string => {
  const tokens = tokenize(text);
  const v = new Array(HASH_BITS).fill(0);

  tokens.forEach((token) => {
    const hash = stringHash(token); // Returns a 32-bit unsigned integer
    for (let i = 0; i < HASH_BITS; i++) {
      const bitmask = 1 << i;
      if ((hash & bitmask) !== 0) {
        v[i] += 1;
      } else {
        v[i] -= 1;
      }
    }
  });

  let fingerprint = 0;
  for (let i = 0; i < HASH_BITS; i++) {
    if (v[i] > 0) {
      fingerprint |= 1 << i;
    }
  }

  // Convert to unsigned 32-bit hex string for storage
  return (fingerprint >>> 0).toString(16).padStart(8, "0");
};

/**
 * Calculates Hamming distance between two 32-bit hex SimHashes
 */
export const simHashDistance = (hash1Hex: string, hash2Hex: string): number => {
  const h1 = parseInt(hash1Hex, 16);
  const h2 = parseInt(hash2Hex, 16);
  let xor = (h1 ^ h2) >>> 0;
  let distance = 0;
  while (xor > 0) {
    distance += xor & 1;
    xor >>>= 1;
  }
  return distance;
};

/**
 * Mock embedding generation (In a real app, call OpenAI API here)
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  // For demo purposes, return a random vector of size 1536
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
};
