import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SourceConfig {
  name: string;
  method: "npm" | "download";
  url?: string;
  npmPackage?: string;
  sourcePath?: string;
  outputFilename: string;
}

const SOURCES: SourceConfig[] = [
  {
    name: "Caniuse Data",
    method: "download",
    url: "https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json",
    outputFilename: "caniuse.json"
  },
  {
    name: "Caniuse Usage Data",
    method: "download",
    url: "https://raw.githubusercontent.com/Fyrd/caniuse/main/region-usage-json/alt-ww.json",
    outputFilename: "alt-ww.json"
  },
  {
    name: "Web Features",
    method: "npm",
    npmPackage: "web-features",
    sourcePath: "node_modules/web-features/data.json",
    outputFilename: "webfeatures.json"
  },
  {
    name: "MDN Browser Compat Data",
    method: "npm",
    npmPackage: "@mdn/browser-compat-data",
    sourcePath: "node_modules/@mdn/browser-compat-data/data.json",
    outputFilename: "mdnbcd.json"
  }
];

const DATA_DIR = path.resolve(__dirname, "../data/sources");
const PROJECT_ROOT = path.resolve(__dirname, "..");

async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`  Downloading from: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.text();
  
  fs.writeFileSync(outputPath, data, "utf-8");
  
  const sizeKB = (data.length / 1024).toFixed(2);
  console.log(`  Saved to: ${outputPath} (${sizeKB} KB)`);
}

function installNpmPackages(packages: string[]): void {
  console.log(`\n📦 Installing npm packages: ${packages.join(", ")}`);
  
  try {
    execSync(`npm install --no-save ${packages.join(" ")}`, {
      cwd: PROJECT_ROOT,
      stdio: "inherit"
    });
    console.log(`  ✅ Packages installed`);
  } catch (error) {
    throw new Error(`Failed to install npm packages: ${error}`);
  }
}

function copyNpmFile(sourcePath: string, outputPath: string): void {
  const fullSourcePath = path.resolve(PROJECT_ROOT, sourcePath);
  
  if (!fs.existsSync(fullSourcePath)) {
    throw new Error(`Source file not found: ${fullSourcePath}`);
  }
  
  fs.copyFileSync(fullSourcePath, outputPath);
  
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`  Copied to: ${outputPath} (${sizeKB} KB)`);
}

async function processSource(source: SourceConfig): Promise<boolean> {
  console.log(`\n📥 ${source.name}`);
  
  const outputPath = path.join(DATA_DIR, source.outputFilename);
  
  try {
    if (source.method === "download" && source.url) {
      await downloadFile(source.url, outputPath);
    } else if (source.method === "npm" && source.sourcePath) {
      copyNpmFile(source.sourcePath, outputPath);
    }
    
    console.log(`  ✅ Success`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("CLONE SOURCE DATA");
  console.log("=".repeat(60));
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`\n📁 Creating directory: ${DATA_DIR}`);
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Install npm packages first
  const npmSources = SOURCES.filter(s => s.method === "npm");
  if (npmSources.length > 0) {
    const packages = npmSources
      .map(s => s.npmPackage)
      .filter((p): p is string => p !== undefined);
    
    installNpmPackages(packages);
  }
  
  // Process all sources
  const results = await Promise.all(
    SOURCES.map(source => processSource(source))
  );
  
  // Summary
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log("\n" + "=".repeat(60));
  console.log(`SUMMARY: ${successCount}/${totalCount} sources downloaded successfully`);
  console.log("=".repeat(60));
  
  if (successCount < totalCount) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});