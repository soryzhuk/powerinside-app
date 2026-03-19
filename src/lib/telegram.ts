import { createHmac } from "crypto";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
  query_id?: string;
  start_param?: string;
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Steps:
 * 1. Create HMAC-SHA256 of "WebAppData" with bot token as key -> secret_key
 * 2. Sort all params (except hash) alphabetically as "key=value\n" -> data_check_string
 * 3. Create HMAC-SHA256 of data_check_string with secret_key
 * 4. Compare with hash from initData
 */
export function validateTelegramWebAppData(
  initData: string,
  botToken: string
): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      return false;
    }

    // Remove hash from params for validation
    params.delete("hash");

    // Sort params alphabetically and build data-check-string
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    // Create secret key: HMAC-SHA256 of bot token with "WebAppData" as key
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Create HMAC-SHA256 of data-check-string with secret key
    const computedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return computedHash === hash;
  } catch {
    return false;
  }
}

/**
 * Parses Telegram WebApp initData string into a structured object.
 * The `user` field is JSON-encoded within the URL params.
 */
export function parseTelegramInitData(initData: string): TelegramInitData {
  const params = new URLSearchParams(initData);

  const result: TelegramInitData = {
    auth_date: parseInt(params.get("auth_date") || "0", 10),
    hash: params.get("hash") || "",
  };

  const userParam = params.get("user");
  if (userParam) {
    try {
      result.user = JSON.parse(userParam) as TelegramUser;
    } catch {
      // Invalid JSON in user param — leave user undefined
    }
  }

  const chatInstance = params.get("chat_instance");
  if (chatInstance) result.chat_instance = chatInstance;

  const chatType = params.get("chat_type");
  if (chatType) result.chat_type = chatType;

  const queryId = params.get("query_id");
  if (queryId) result.query_id = queryId;

  const startParam = params.get("start_param");
  if (startParam) result.start_param = startParam;

  return result;
}

/**
 * Validates initData and returns parsed user data if valid.
 * Returns null if validation fails.
 */
export function validateAndParseTelegram(
  initData: string,
  botToken: string
): TelegramInitData | null {
  if (!validateTelegramWebAppData(initData, botToken)) {
    return null;
  }
  return parseTelegramInitData(initData);
}

export type { TelegramUser, TelegramInitData };
