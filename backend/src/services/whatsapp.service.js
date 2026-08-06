import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read templates.json
const templatesPath = path.join(__dirname, '..', 'config', 'templates.json');
const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

// Provide defaults since these might not be in env.js yet
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v23.0";

const getApiUrl = () => {
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
  if (!PHONE_NUMBER_ID) throw new Error("Missing PHONE_NUMBER_ID in .env");
  return `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
};

// Core sender: posts any message payload to the Cloud API.
export async function send(payload) {
  const TOKEN = process.env.WHATSAPP_TOKEN;
  if (!TOKEN) {
    throw new Error("Missing WHATSAPP_TOKEN in .env");
  }

  let to = String(payload.to).replace(/\D/g, '');
  if (to.length === 10) {
    to = '91' + to;
  }
  payload.to = to;

  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || JSON.stringify(data));
  }
  return data;
}

export function sendText(to, body) {
  return send({ to, type: "text", text: { body, preview_url: false } });
}

export function sendTemplate(to, templateName, languageCode = "en_US", params = []) {
  const components = params.length
    ? [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text: String(text) })),
        },
      ]
    : [];

  return send({
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

// Send a WhatsApp AUTHENTICATION template carrying a one-time password.
export function sendAuthTemplate(to, key, otp) {
  const tpl = templates[key];
  if (!tpl) {
    throw new Error(`Template "${key}" not found in templates.json`);
  }

  const code = String(otp);
  return send({
    to,
    type: "template",
    template: {
      name: tpl.name,
      language: { code: tpl.language || "en_US" },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        {
          type: "button",
          sub_type: tpl.buttonSubType || "url",
          index: "0",
          parameters: [{ type: "text", text: code }],
        },
      ],
    },
  });
}

// Send a template defined in templates.json by its key.
export function sendTemplateByKey(to, key, data = {}) {
  const tpl = templates[key];
  if (!tpl) {
    throw new Error(`Template "${key}" not found in templates.json`);
  }

  const varNames = tpl.variables || [];
  const parameters = varNames.map((name) => {
    const param = { type: "text", text: String(data[name] ?? "") };
    if (tpl.namedParams) param.parameter_name = name;
    return param;
  });

  const components = parameters.length ? [{ type: "body", parameters }] : [];

  return send({
    to,
    type: "template",
    template: {
      name: tpl.name,
      language: { code: tpl.language || "en_US" },
      components,
    },
  });
}

// Ensure phone is normalized: digits only
export function normalizePhone(raw) {
  let cleaned = String(raw || "").replace(/[^\d]/g, "");
  // If the number doesn't have a country code but is 10 digits, add '91' for India by default
  // This depends on the application's target audience, but assuming Indian numbers for now
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

export async function checkConnection() {
  const TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  if (!TOKEN || !PHONE_NUMBER_ID) {
    return 'Disconnected (Missing credentials in .env)';
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}?fields=display_phone_number&access_token=${TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok && data.display_phone_number) {
      return `Connected (${data.display_phone_number})`;
    } else {
      return `Invalid Token or ID (${data.error?.message || 'Unknown Error'})`;
    }
  } catch (err) {
    return `Network Error (${err.message})`;
  }
}
