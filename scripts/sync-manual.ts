#!/usr/bin/env bun
/**
 * Fetch and cryptographically verify both Koma (`/docs/`) and Jiku (`/jiku/docs/`)
 * tri-lingual manuals (`en`, `zh-CN`, `ja`) from Cloudflare R2 (`https://cdn.komawm.org/manual/`).
 *
 * - When invoked by `repository_dispatch` (`manual-published`), uses the exact
 *   version paths and SHA-256 digests supplied in `MANUAL_DISPATCH_PAYLOAD` and fails closed.
 * - Otherwise resolves `https://cdn.komawm.org/manual/{koma,jiku}/latest.json`.
 * - With `--if-available` (when no `MANUAL_DISPATCH_PAYLOAD` is set), falls back cleanly
 *   to the bundled `src/content/manual/` snapshot if the live CDN endpoint is unreachable.
 */

import { createHash } from "node:crypto";
import { access, cp, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Locale = "en" | "zh-CN" | "ja";
type Surface = "koma" | "jiku";

interface SurfacePointer {
  readonly schema: 1;
  readonly surface: Surface;
  readonly version: string;
  readonly revision: string;
  readonly version_dir: string;
  readonly manifest: { readonly path: string; readonly sha256: string };
  readonly bundles: Readonly<
    Record<Locale, { readonly path: string; readonly sha256: string }>
  >;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_ROOT = join(ROOT, "src/content/manual");
const CDN_BASE = process.env.PUBLIC_CDN_BASE_URL ?? "https://cdn.komawm.org";
const LOCALES: readonly Locale[] = ["en", "zh-CN", "ja"];
const SURFACES: readonly Surface[] = ["koma", "jiku"];
const HEX_64 = /^[a-f0-9]{64}$/u;
const IF_AVAILABLE = process.argv.includes("--if-available");

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertSafeRelativePath(entryPath: string, locale: Locale): void {
  const cleaned = entryPath.replace(/^\.\//u, "");
  if (cleaned === "" || cleaned === `${locale}/`) return;
  if (
    !cleaned.startsWith(`${locale}/`) ||
    cleaned.includes("..") ||
    cleaned.startsWith("/")
  ) {
    throw new Error(`unsafe archive member path: ${entryPath}`);
  }
}

async function hasBundledFallback(surface: Surface): Promise<boolean> {
  try {
    await access(join(CONTENT_ROOT, surface, "manifest.json"));
    for (const locale of LOCALES) {
      await access(join(CONTENT_ROOT, surface, locale));
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (err) {
      if (attempt === 3) throw err;
      await Bun.sleep(400 * attempt);
    }
  }
  throw new Error(`exhausted retries for ${url}`);
}

function parseDispatchPayload(): Partial<Record<Surface, SurfacePointer>> | null {
  const rawDispatch = process.env.MANUAL_DISPATCH_PAYLOAD?.trim();
  if (!rawDispatch || rawDispatch === "null" || rawDispatch === "{}") {
    return null;
  }
  const parsed = JSON.parse(rawDispatch) as {
    surfaces?: Partial<Record<Surface, SurfacePointer>>;
  };
  return parsed.surfaces ?? null;
}

async function resolvePointer(
  surface: Surface,
  dispatchSurfaces: Partial<Record<Surface, SurfacePointer>> | null,
): Promise<{ pointer: SurfacePointer; fromDispatch: boolean }> {
  const fromDispatch = dispatchSurfaces?.[surface];
  if (fromDispatch) {
    return { pointer: fromDispatch, fromDispatch: true };
  }
  const url = `${CDN_BASE}/manual/${surface}/latest.json`;
  const bytes = await fetchBytes(url);
  return {
    pointer: JSON.parse(new TextDecoder().decode(bytes)) as SurfacePointer,
    fromDispatch: false,
  };
}

async function syncSurface(
  surface: Surface,
  dispatchSurfaces: Partial<Record<Surface, SurfacePointer>> | null,
): Promise<void> {
  let resolved: { pointer: SurfacePointer; fromDispatch: boolean };
  try {
    resolved = await resolvePointer(surface, dispatchSurfaces);
  } catch (err) {
    if (IF_AVAILABLE && !dispatchSurfaces && (await hasBundledFallback(surface))) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        `[sync-manual] ${surface}: CDN unavailable (${msg}); using bundled src/content/manual/${surface} fallback`,
      );
      return;
    }
    throw err;
  }

  const { pointer } = resolved;
  if (pointer.schema !== 1 || pointer.surface !== surface) {
    throw new Error(`invalid manual pointer for ${surface}`);
  }
  if (!HEX_64.test(pointer.manifest.sha256)) {
    throw new Error(`invalid manifest sha256 for ${surface}`);
  }

  const staging = await mkdtemp(join(tmpdir(), `komawm-manual-${surface}-`));
  const destRoot = join(CONTENT_ROOT, surface);
  const nextRoot = join(CONTENT_ROOT, `${surface}.next`);
  try {
    const manifestUrl = `${CDN_BASE}/manual/${surface}/${pointer.manifest.path}`;
    const manifestBytes = await fetchBytes(manifestUrl);
    const actualManifestSha = sha256Hex(manifestBytes);
    if (actualManifestSha !== pointer.manifest.sha256) {
      throw new Error(
        `${surface} manifest digest mismatch: expected ${pointer.manifest.sha256}, got ${actualManifestSha}`,
      );
    }
    const stagingSurface = join(staging, "out");
    await mkdir(stagingSurface, { recursive: true });
    await writeFile(join(stagingSurface, "manifest.json"), manifestBytes);

    for (const locale of LOCALES) {
      const bundle = pointer.bundles[locale];
      if (!bundle || !HEX_64.test(bundle.sha256)) {
        throw new Error(`invalid ${locale} bundle metadata for ${surface}`);
      }
      const archiveBytes = await fetchBytes(
        `${CDN_BASE}/manual/${surface}/${bundle.path}`,
      );
      const actualSha = sha256Hex(archiveBytes);
      if (actualSha !== bundle.sha256) {
        throw new Error(
          `${surface}/${locale} digest mismatch: expected ${bundle.sha256}, got ${actualSha}`,
        );
      }
      const archiveFile = join(staging, `${locale}.tar.gz`);
      await writeFile(archiveFile, archiveBytes);

      const listProc = Bun.spawnSync(["tar", "-tzf", archiveFile], {
        stdout: "pipe",
        stderr: "pipe",
      });
      if (listProc.exitCode !== 0) {
        throw new Error(new TextDecoder().decode(listProc.stderr));
      }
      for (const member of new TextDecoder().decode(listProc.stdout).split("\n")) {
        if (member.trim()) assertSafeRelativePath(member.trim(), locale);
      }

      const extractProc = Bun.spawnSync(
        ["tar", "-xzf", archiveFile, "-C", stagingSurface, "--no-same-owner"],
        { stdout: "pipe", stderr: "pipe" },
      );
      if (extractProc.exitCode !== 0) {
        throw new Error(new TextDecoder().decode(extractProc.stderr));
      }
    }

    await mkdir(CONTENT_ROOT, { recursive: true });
    await rm(nextRoot, { recursive: true, force: true });
    await cp(stagingSurface, nextRoot, { recursive: true });
    await rm(destRoot, { recursive: true, force: true });
    await rename(nextRoot, destRoot);
    console.log(`synced manual/${surface} (${pointer.version_dir})`);
  } finally {
    await rm(staging, { recursive: true, force: true });
    await rm(nextRoot, { recursive: true, force: true });
  }
}

const dispatchSurfaces = parseDispatchPayload();
for (const surface of SURFACES) {
  await syncSurface(surface, dispatchSurfaces);
}
