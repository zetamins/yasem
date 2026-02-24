import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profileStore";

const MAG_USER_AGENTS: Record<string, string> = {
  MAG250: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
  MAG255: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
  MAG256: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
  AuraHD: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1",
};

function getDefaultUserAgent(classId: string, submodel: string): string {
  if (classId === "mag") {
    return MAG_USER_AGENTS[submodel] || MAG_USER_AGENTS.MAG250;
  }
  return "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 TV Safari/538.1";
}

function rewriteHtmlForProxy(html: string, baseUrl: string, profileId: string): string {
  const scriptUrl = `/api/portal-script?profileId=${encodeURIComponent(profileId)}`;

  const injection = `
<script>
(function() {
  var _origXHR = window.XMLHttpRequest;
  var _origFetch = window.fetch;

  window.__yasemProfileId = ${JSON.stringify(profileId)};

  function proxyUrl(url) {
    if (!url) return url;
    try {
      var abs = new URL(url, ${JSON.stringify(baseUrl)}).href;
      if (abs.indexOf(window.location.origin) === 0) return url;
      return '/api/portal-proxy?url=' + encodeURIComponent(abs) + '&profileId=' + encodeURIComponent(${JSON.stringify(profileId)});
    } catch(e) { return url; }
  }

  window.open = function(url, name, features) {
    if (url) window.location.href = proxyUrl(url);
    return window;
  };
})();
</script>
<script src="${scriptUrl}"></script>
`;

  return html.replace(/<head([^>]*)>/i, `<head$1>\n${injection}`);
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  const profileId = request.nextUrl.searchParams.get("profileId") || "";

  if (!urlParam) {
    return new NextResponse("url parameter required", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const profile = profileId ? getProfileById(profileId) : null;
  const userAgent = profile
    ? getDefaultUserAgent(profile.classId, profile.submodel)
    : "Mozilla/5.0";

  const headersToForward = new Headers();
  headersToForward.set("User-Agent", userAgent);
  headersToForward.set("Accept", request.headers.get("Accept") || "*/*");
  headersToForward.set("Accept-Language", "en-US,en;q=0.9");

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headersToForward.set("Cookie", cookieHeader);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const ref = new URL(referer);
      const proxyRef = ref.searchParams.get("url");
      if (proxyRef) {
        headersToForward.set("Referer", proxyRef);
      }
    } catch {
      headersToForward.set("Referer", targetUrl.origin);
    }
  }

  try {
    const response = await fetch(targetUrl.href, {
      headers: headersToForward,
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "";
    const responseHeaders = new Headers();

    for (const [key, value] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower === "content-encoding" ||
        lower === "content-length" ||
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "x-frame-options" ||
        lower === "content-security-policy"
      ) {
        continue;
      }
      responseHeaders.set(key, value);
    }

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("X-Frame-Options", "SAMEORIGIN");

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const rewritten = rewriteHtmlForProxy(html, targetUrl.href, profileId);
      responseHeaders.set("Content-Type", "text/html; charset=utf-8");
      return new NextResponse(rewritten, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[portal-proxy] fetch error:", err);
    const errorHtml = `
<!DOCTYPE html>
<html>
<head><title>Portal Error</title>
<style>body{background:#0a0f1e;color:coral;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
.box{text-align:center;padding:40px;border:1px solid #31708f;border-radius:16px;max-width:600px;}
h1{color:#5ea5c8;margin-bottom:16px;}
p{margin:8px 0;color:#8ab0c8;}
</style>
</head>
<body>
<div class="box">
<h1>Portal Unavailable</h1>
<p>Could not connect to portal:</p>
<p style="color:coral;word-break:break-all">${targetUrl.href}</p>
<p>Please check the portal URL in your profile configuration.</p>
</div>
</body>
</html>`;
    return new NextResponse(errorHtml, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
