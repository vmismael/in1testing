import type { IconName } from "@/components/icons";

export type ToolCategory = "pdf" | "image" | "video" | "text" | "web";

/** Where the actual work happens. Client tools never upload the user's files. */
export type ProcessingMode = "client" | "server";

export interface ToolFaq {
  q: string;
  a: string;
}

/** A single HowTo step. Rendered visibly and emitted as schema.org HowTo. */
export interface ToolStep {
  name: string;
  text: string;
}

/** A long-form content block used to reach the 800+ word SEO target. */
export interface ToolSection {
  heading: string;
  body: string;
}

export interface Tool {
  slug: string;
  category: ToolCategory;
  name: string;
  /** One-liner shown on cards and category lists. */
  shortDescription: string;
  icon: IconName;
  processing: ProcessingMode;

  // --- SEO ---
  metaTitle: string;
  metaDescription: string;
  keywords?: string[];
  h1: string;
  /** Lead paragraph shown under the H1. */
  intro: string;
  sections: ToolSection[];
  faq: ToolFaq[];
  howTo: ToolStep[];

  // --- Client-side file processing hints ---
  /** Accepted MIME types for the dropzone. Omit for non-file tools. */
  accept?: string[];
  /** Whether multiple files can be processed at once. */
  multiple?: boolean;

  /** When true the page renders but the processor shows a "coming soon" state. */
  comingSoon?: boolean;
}

export interface CategoryMeta {
  slug: ToolCategory;
  label: string;
  icon: IconName;
  description: string;
}
