/**
 * IndexNow Integration
 * Submit URLs to search engines (Bing, Yandex, Seznam, Naver) for instant indexing.
 * Protocol spec: https://www.indexnow.org/documentation
 */

import { seoConfig } from "./config";

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/IndexNow",
  "https://www.bing.com/IndexNow",
  "https://yandex.com/indexnow",
] as const;

const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || "0425bb255d5944648d196e29a60f7cfb";

export interface IndexNowResult {
  endpoint: string;
  status: number;
  ok: boolean;
  message: string;
}

export interface IndexNowSubmission {
  urlCount: number;
  results: IndexNowResult[];
  submitted: boolean;
}

function getKeyLocation(): string {
  return `${seoConfig.site.url}/${INDEXNOW_KEY}.txt`;
}

/**
 * Normalize and validate a URL for IndexNow submission.
 * - Accepts absolute HTTP(S) URLs.
 * - Accepts relative URLs that start with '/' and resolves them against seoConfig.site.url.
 * Throws an error if the URL is invalid or uses an unsupported scheme.
 */
function normalizeIndexNowUrl(input: string): string {
  const url = input.trim();

  // Absolute URL: must be valid HTTP(S)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Invalid absolute URL provided for IndexNow submission.");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only HTTP(S) URLs can be submitted to IndexNow.");
    }

    return parsed.toString();
  }

  // Relative URL: must start with '/'
  if (url.startsWith("/")) {
    try {
      return new URL(url, seoConfig.site.url).toString();
    } catch {
      throw new Error("Invalid relative URL provided for IndexNow submission.");
    }
  }

  throw new Error(
    "URL must be an absolute HTTP(S) URL or a relative URL starting with '/'.",
  );
}

/**
 * Submit a single URL to IndexNow search engines.
 */
export async function submitUrl(url: string): Promise<IndexNowSubmission> {
  let fullUrl: string;

  try {
    fullUrl = normalizeIndexNowUrl(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid URL provided.";

    return {
      urlCount: 0,
      results: INDEXNOW_ENDPOINTS.map((endpoint) => ({
        endpoint,
        status: 0,
        ok: false,
        message,
      })),
      submitted: false,
    };
  }
  const results: IndexNowResult[] = [];

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const params = new URLSearchParams({
        url: fullUrl,
        key: INDEXNOW_KEY,
        keyLocation: getKeyLocation(),
      });

      const response = await fetch(`${endpoint}?${params}`, {
        method: "GET",
      });

      const isSuccess =
        response.ok || response.status === 200 || response.status === 202;

      let message = getStatusMessage(response.status);

      if (!isSuccess) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // Ignore errors while reading response body
        }

        const statusText = response.statusText || message;

        if (errorBody) {
          message = `${statusText} - Response body: ${errorBody}`;
        } else {
          message = statusText;
        }

        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[IndexNow] Submission failed for endpoint ${endpoint}: ${statusText}`,
            errorBody ? `Response body: ${errorBody}` : undefined
          );
        }
      }

      results.push({
        endpoint,
        status: response.status,
        ok: isSuccess,
        message,
      });
    } catch (error) {
      results.push({
        endpoint,
        status: 0,
        ok: false,
        message: error instanceof Error ? error.message : "Network error",
      });
    }
  }

  return {
    urlCount: 1,
    results,
    submitted: results.some((r) => r.ok),
  };
}

/**
 * Submit multiple URLs to IndexNow search engines in bulk.
 * IndexNow supports up to 10,000 URLs per batch submission.
 */
export async function submitUrls(urls: string[]): Promise<IndexNowSubmission> {
  if (urls.length === 0) {
    return { urlCount: 0, results: [], submitted: false };
  }

  if (urls.length === 1) {
    return submitUrl(urls[0]);
  }

  const fullUrls = urls.map((url) =>
    url.startsWith("http") ? url : `${seoConfig.site.url}${url}`
  );

  const host = new URL(seoConfig.site.url).host;
  const results: IndexNowResult[] = [];

  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: getKeyLocation(),
    urlList: fullUrls.slice(0, 10000),
  };

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });

      results.push({
        endpoint,
        status: response.status,
        ok: response.ok || response.status === 200 || response.status === 202,
        message: getStatusMessage(response.status),
      });
    } catch (error) {
      results.push({
        endpoint,
        status: 0,
        ok: false,
        message: error instanceof Error ? error.message : "Network error",
      });
    }
  }

  return {
    urlCount: fullUrls.length,
    results,
    submitted: results.some((r) => r.ok),
  };
}

function getStatusMessage(status: number): string {
  switch (status) {
    case 200:
      return "OK - URL submitted successfully";
    case 202:
      return "Accepted - URL received, key validation pending";
    case 400:
      return "Bad Request - Invalid format";
    case 403:
      return "Forbidden - Key not valid or not matching";
    case 422:
      return "Unprocessable Entity - URLs not owned by the host";
    case 429:
      return "Too Many Requests - Rate limited";
    default:
      return `Unexpected status: ${status}`;
  }
}
