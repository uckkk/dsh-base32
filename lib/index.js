// dsh-base32 — Base32 编解码（RFC 4648）。纯 Node。
import { defineTool } from "@deepseek-ai/dsh-tools";

const name = "Base32";
const inject = ["tools"];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(input, { padding = true } = {}) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  if (padding) while (out.length % 8 !== 0) out += "=";
  return out;
}

function base32Decode(input) {
  const s = String(input).replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z2-7]*$/.test(s)) throw new Error(`非法 Base32：${input}`);
  let bits = 0, value = 0;
  const out = [];
  for (const c of s) {
    value = (value << 5) | ALPHABET.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

async function apply(ctx, _config) {
  ctx.tools.register(defineTool({
    name: "base32_encode",
    description: "把文本（UTF-8）编码为 Base32（RFC 4648 标准字母表 A-Z2-7）。`padding` 控制是否填充 `=`，默认 true。",
    parameters: {
      text: { type: "string", required: true, description: "要编码的文本。" },
      padding: { type: "boolean", description: "是否填充 =，默认 true。" },
    },
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { encoded: { type: "string", required: true } },
      },
      render: (_a, v) => [{ type: "text", text: v.encoded }],
    },
    execute: async (args) => ({ encoded: base32Encode(args.text, { padding: args.padding !== false }) }),
  }));

  ctx.tools.register(defineTool({
    name: "base32_decode",
    description: "把 Base32 字符串解码为文本（UTF-8）。",
    parameters: { encoded: { type: "string", required: true, description: "Base32 字符串。" } },
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { text: { type: "string", required: true } },
      },
      render: (_a, v) => [{ type: "text", text: v.text }],
    },
    execute: async (args) => ({ text: base32Decode(args.encoded).toString("utf8") }),
  }));
}

export { apply, inject, name };
