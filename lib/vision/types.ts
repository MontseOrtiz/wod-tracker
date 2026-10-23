export type WhiteboardImage = {
  data: Buffer;
  mimeType: string;
};

// Anything that can turn a photo of a workout into raw JSON. The result is
// untrusted: `parseWhiteboard` validates it before the rest of the app sees it.
export interface WhiteboardReader {
  read(image: WhiteboardImage): Promise<unknown>;
}

// The provider is overloaded or rate limited; the user can retry shortly.
export class VisionUnavailableError extends Error {}

// The provider failed or answered something unusable.
export class VisionError extends Error {}
