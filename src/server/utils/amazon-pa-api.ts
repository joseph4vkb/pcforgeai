// DEPRECATED: Amazon Product Advertising API utilities have been removed.
//
// The application now uses AI-generated product catalog instead of querying
// the Amazon PA API directly. Product data is stored in the database and
// queried using the getAmazonProducts procedure.
//
// This file is kept for reference only and its functions should not be used.

export type PartData = {
  category: string;
  name: string;
  asin: string;
  price: number;
  specs: Record<string, any>;
  url?: string;
  imageUrl?: string;
};

export type AmazonPACredentials = {
  accessKey: string;
  secretKey: string;
  affiliateId: string;
};

// These functions are deprecated and should not be used
export async function fetchAmazonProductData(): Promise<null> {
  throw new Error("This function has been deprecated. Use AI-generated product catalog instead.");
}

export async function updatePartsWithAmazonData(): Promise<never> {
  throw new Error("This function has been deprecated. Use AI-generated product catalog instead.");
}
