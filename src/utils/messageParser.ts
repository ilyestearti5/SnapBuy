/**
 * Utility functions for parsing AI messages to detect product and order IDs
 */

export interface ParsedMessageContent {
  text: string;
  productIds: string[];
  orderIds: string[];
  hasEnhancedContent: boolean;
}

export interface MessageEntity {
  type: "product" | "order";
  id: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Regular expressions to detect product and order IDs in messages
 */
const PRODUCT_ID_PATTERNS = [
  // Direct product ID mentions
  /product[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /productId[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /product\s+id[:\-\s]*([a-f0-9\-]{8,36})/gi,

  // UUID patterns that might be product IDs in context
  /(?:found|showing|displaying|available)\s+.*?([a-f0-9\-]{8,36})/gi,

  // Contextual product mentions
  /item[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /sku[:\-\s]*([a-f0-9\-]{8,36})/gi,
];

const ORDER_ID_PATTERNS = [
  // Direct order ID mentions
  /order[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /orderId[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /order\s+id[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /order\s+number[:\-\s]*([a-f0-9\-]{8,36})/gi,

  // Tracking-related patterns
  /tracking[:\-\s]*([a-f0-9\-]{8,36})/gi,
  /shipment[:\-\s]*([a-f0-9\-]{8,36})/gi,
];

/**
 * Validates if a string looks like a valid UUID/ID
 */
function isValidId(id: string): boolean {
  // Check if it's a valid UUID format or at least 8 characters of hex
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hexPattern = /^[0-9a-f]{8,}$/i;

  return uuidPattern.test(id) || hexPattern.test(id);
}

/**
 * Extracts product IDs from message content
 */
export function extractProductIds(content: string): string[] {
  const productIds: string[] = [];

  PRODUCT_ID_PATTERNS.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const id = match[1]?.trim();
      if (id && isValidId(id) && !productIds.includes(id)) {
        productIds.push(id);
      }
    }
  });

  return productIds;
}

/**
 * Extracts order IDs from message content
 */
export function extractOrderIds(content: string): string[] {
  const orderIds: string[] = [];

  ORDER_ID_PATTERNS.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const id = match[1]?.trim();
      if (id && isValidId(id) && !orderIds.includes(id)) {
        orderIds.push(id);
      }
    }
  });

  return orderIds;
}

/**
 * Finds all entities (products and orders) with their positions in the text
 */
export function findMessageEntities(content: string): MessageEntity[] {
  const entities: MessageEntity[] = [];

  // Find product entities
  PRODUCT_ID_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const id = match[1]?.trim();
      if (id && isValidId(id)) {
        entities.push({
          type: "product",
          id,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  });

  // Find order entities
  ORDER_ID_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const id = match[1]?.trim();
      if (id && isValidId(id)) {
        entities.push({
          type: "order",
          id,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  });

  // Sort by position in text
  entities.sort((a, b) => a.startIndex - b.startIndex);

  // Remove duplicates
  const uniqueEntities: MessageEntity[] = [];
  entities.forEach((entity) => {
    const exists = uniqueEntities.some(
      (existing) => existing.type === entity.type && existing.id === entity.id
    );
    if (!exists) {
      uniqueEntities.push(entity);
    }
  });

  return uniqueEntities;
}

/**
 * Parses message content and extracts all relevant information
 */
export function parseMessageContent(content: string): ParsedMessageContent {
  const productIds = extractProductIds(content);
  const orderIds = extractOrderIds(content);
  const hasEnhancedContent = productIds.length > 0 || orderIds.length > 0;

  return {
    text: content,
    productIds,
    orderIds,
    hasEnhancedContent,
  };
}

/**
 * Checks if the message content contains references to products or orders
 */
export function hasProductOrOrderReferences(content: string): boolean {
  const parsed = parseMessageContent(content);
  return parsed.hasEnhancedContent;
}

/**
 * Creates a formatted message with highlighted product/order references
 * This can be used for debugging or enhanced display
 */
export function formatMessageWithHighlights(content: string): string {
  const entities = findMessageEntities(content);

  if (entities.length === 0) {
    return content;
  }

  let formattedContent = content;
  let offset = 0;

  entities.forEach((entity) => {
    const startPos = entity.startIndex + offset;
    const endPos = entity.endIndex + offset;
    const originalText = formattedContent.substring(startPos, endPos);
    const highlightedText = `**${originalText}**`; // Markdown bold

    formattedContent =
      formattedContent.substring(0, startPos) +
      highlightedText +
      formattedContent.substring(endPos);

    offset += highlightedText.length - originalText.length;
  });

  return formattedContent;
}
