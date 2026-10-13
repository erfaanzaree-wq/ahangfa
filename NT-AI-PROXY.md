# New Taraneh AI Proxy

GitHub Pages cannot run a live API proxy. Use free **Cloudflare Workers**.

## Deploy (2 minutes)
1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create Worker**
2. Paste code from `nt-ai-proxy-worker.js`
3. **Settings → Variables** → add secrets:
   - `AVALAI_KEY` = your AvalAI key
   - `OR_KEY_1` … `OR_KEY_4` = OpenRouter keys
4. Deploy and copy URL, e.g. `https://nt-ai-proxy.xxx.workers.dev`
5. In blog template set:
   ```js
   PROXY_URL: 'https://nt-ai-proxy.xxx.workers.dev'
   ```

Worker path used by the chat client: `{PROXY_URL}/v1/chat/completions`
