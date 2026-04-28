import { cp, mkdir, access, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const dataDir = path.join(rootDir, "data");
const distDataDir = path.join(distDir, "data");
const indexPath = path.join(distDir, "index.html");
const noJekyllPath = path.join(distDir, ".nojekyll");

await mkdir(distDir, { recursive: true });
await access(indexPath);
await cp(dataDir, distDataDir, { recursive: true, force: true });
const redirect404Html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Talea · Reindirizzamento</title>
    <script>
      (function () {
        var pathname = window.location.pathname || "/";
        var match = pathname.match(/^(.*\\/)?view\\/(v[1-5])\\/?$/);
        var params = new URLSearchParams(window.location.search);
        if (match && !params.has("view")) {
          params.set("view", match[2]);
          var basePath = match[1] || "/";
          var target = basePath + (params.toString() ? "?" + params.toString() : "");
          if (window.location.hash) target += window.location.hash;
          window.location.replace(target);
          return;
        }
        var fallbackPath = pathname.endsWith("/") ? pathname : pathname.slice(0, pathname.lastIndexOf("/") + 1);
        window.location.replace(fallbackPath || "/");
      })();
    </script>
  </head>
  <body></body>
</html>
`;
await writeFile(path.join(distDir, "404.html"), redirect404Html, "utf8");
await writeFile(noJekyllPath, "", "utf8");
