/**
 * Strip TypeScript from .tsx files → .jsx using `typescript.transpileModule`
 * (imports like `@/` are preserved).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();

function walk(dir, out) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".")) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (name.name.endsWith(".tsx")) out.push(p);
  }
}

function convertFile(absPath) {
  const source = fs.readFileSync(absPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      verbatimModuleSyntax: false,
      isolatedModules: true,
      alwaysStrict: false,
    },
    fileName: path.basename(absPath),
    reportDiagnostics: false,
  });
  const outPath = absPath.replace(/\.tsx$/i, ".jsx");
  fs.writeFileSync(outPath, outputText.replace(/\r?\n$/u, "\n"), "utf8");
  fs.unlinkSync(absPath);
  console.log(path.relative(root, absPath), "→", path.relative(root, outPath));
}

function main() {
  const skip = path.join(root, "node_modules");
  const files = [];
  walk(path.join(root, "src"), files);
  for (const f of files) {
    if (f.startsWith(skip)) continue;
    convertFile(f);
  }
}

main();
