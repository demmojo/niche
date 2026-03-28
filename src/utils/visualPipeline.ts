import { withModelFallback } from "./aiClient";
import { downscaleImageBase64 } from "./imageUtils";

export interface BoundingBox {
  id: string;
  type: string;
  text?: string;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface OmniParserResult {
  elements: BoundingBox[];
}

export interface ExtractedFeature {
  name: string;
  confidence: number;
  boundingBoxId?: string;
  competitiveImportanceScore: number;
  reasoning: string;
}

export interface VisualAnalysisResult {
  omniParser: OmniParserResult;
  features: ExtractedFeature[];
  proxyInfo: {
    downscaled: boolean;
    provider: string;
  };
}

// 1. Step 1: Fast/Local Bounding Box Detection (Mocked OmniParser)
export async function runOmniParser(
  imageBase64: string,
): Promise<OmniParserResult> {
  // In a real implementation, this would call a local model or specialized fast vision API
  // to draw bounding boxes over UI elements to prevent LLM hallucination.
  return {
    elements: [
      {
        id: "btn-signup",
        type: "button",
        text: "Sign Up",
        bbox: [10, 20, 100, 40],
      },
      {
        id: "nav-pricing",
        type: "link",
        text: "Pricing",
        bbox: [150, 20, 200, 40],
      },
      { id: "img-dashboard", type: "image", bbox: [50, 100, 800, 600] },
    ],
  };
}

// 2. Step 2: Multimodal LLM Semantic Mapping
export async function extractFeaturesFromVisuals(
  imageBase64: string,
  omniParserData: OmniParserResult,
): Promise<ExtractedFeature[]> {
  const prompt = `You are an expert product analyst. Analyze the provided screenshot along with the pre-processed bounding box data.
  Map the UI elements to abstract product features.
  
  Bounding Box Data:
  ${JSON.stringify(omniParserData, null, 2)}
  
  Return a JSON array of extracted features strictly following this structure:
  [{
    "name": "Feature Name (e.g., 'One-Click Onboarding')",
    "confidence": 0.95,
    "boundingBoxId": "btn-signup",
    "competitiveImportanceScore": 85,
    "reasoning": "Why is this feature competitively important based on the visual hierarchy?"
  }]`;

  try {
    const response = await withModelFallback(
      async (ai, model) => {
        // In reality, you would pass the image part to the multimodal model
        return ai.generateContent(model, {
          // Prefer gemini-3.1-pro-preview for vision tasks
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
      },
      { capability: "reasoning" },
    );

    const text = response.text || "[]";
    return JSON.parse(text) as ExtractedFeature[];
  } catch (error) {
    console.error("Error extracting visual features:", error);
    return [];
  }
}

// Main Orchestrator
export async function analyzeVisuals(
  imageBase64: string,
  provider: string = "gemini",
): Promise<VisualAnalysisResult> {
  // BYOK Proxy: Downscale image to max 1080p to save tokens
  const optimizedImage = downscaleImageBase64(imageBase64);

  // Step 1: Detect UI elements
  const omniData = await runOmniParser(optimizedImage);

  // Step 2: Extract features using Multimodal LLM
  const features = await extractFeaturesFromVisuals(optimizedImage, omniData);

  return {
    omniParser: omniData,
    features,
    proxyInfo: {
      downscaled: true,
      provider,
    },
  };
}
