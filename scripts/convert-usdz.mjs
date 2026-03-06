import { mkdtemp, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const MODELS_DIR = join(PROJECT_ROOT, 'public', 'models');
// USDZ files live next to glb assets but in a separate directory
const USDZ_DIR = join(PROJECT_ROOT, 'public', 'models', 'usdz');

function parseArgs() {
  const args = process.argv.slice(2);
  let input = null;
  let overwrite = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--input' || arg === '-i') {
      input = args[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (arg === '--overwrite') {
      overwrite = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return { input, overwrite };
}

function printHelp() {
  console.log('GLB -> USDZ converter (Blender backend)');
  console.log('');
  console.log('Usage:');
  console.log('  npm run convert-usdz');
  console.log('  npm run convert-usdz -- --input public/models/glb/xxxx.glb');
  console.log('  npm run convert-usdz -- --overwrite');
  console.log('');
  console.log('Options:');
  console.log('  -i, --input <path>   Convert a single .glb file');
  console.log('      --overwrite      Overwrite existing .usdz files');
  console.log('  -h, --help           Show this help');
  console.log('');
  console.log('Requirements: Blender must be installed and available in PATH.');
}

async function collectGlbFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectGlbFiles(fullPath);
      files.push(...nested);
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.glb') {
      files.push(fullPath);
    }
  }

  return files;
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function ensureBlenderAvailable() {
  try {
    await run('blender', ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      'Blender is not available in PATH. Install Blender and ensure `blender` command works.',
    );
  }
}

function createPythonScriptContent() {
  return `import bpy\nimport sys\n\nargv = sys.argv\nargv = argv[argv.index("--") + 1:]\ninput_path = argv[0]\noutput_path = argv[1]\n\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.import_scene.gltf(filepath=input_path)\n\nbpy.ops.wm.usd_export(\n    filepath=output_path,\n    check_existing=False,\n    selected_objects_only=False,\n)\n`;
}

async function convertWithBlender(pythonScriptPath, inputPath, outputPath) {
  await run('blender', [
    '--background',
    '--factory-startup',
    '--python',
    pythonScriptPath,
    '--',
    inputPath,
    outputPath,
  ]);

  if (!existsSync(outputPath)) {
    throw new Error(`Conversion output not found: ${outputPath}`);
  }
}

async function main() {
  const { input, overwrite } = parseArgs();

  await ensureBlenderAvailable();

  // make sure USDZ output directory exists
  await mkdir(USDZ_DIR, { recursive: true });

  let targets = [];

  if (input) {
    const absoluteInput = resolve(PROJECT_ROOT, input);
    if (!existsSync(absoluteInput)) {
      throw new Error(`Input file does not exist: ${absoluteInput}`);
    }
    if (extname(absoluteInput).toLowerCase() !== '.glb') {
      throw new Error(`Input must be a .glb file: ${absoluteInput}`);
    }
    targets = [absoluteInput];
  } else {
    // recursively search under models directory (includes glb subfolder)
    targets = await collectGlbFiles(MODELS_DIR);
  }

  if (targets.length === 0) {
    console.log('No .glb files found to convert.');
    return;
  }

  const tmpDir = await mkdtemp(join(tmpdir(), 'glb-usdz-'));
  const pythonScriptPath = join(tmpDir, 'convert.py');

  try {
    await writeFile(pythonScriptPath, createPythonScriptContent(), 'utf-8');

    console.log(`Found ${targets.length} GLB file(s).`);

    for (const glbPath of targets) {
      // place output in /models/usdz, mirroring the filename
      // if the input path includes "/models/glb/", convert that segment to "/models/usdz/" as well
      let usdzPath = glbPath.replace(/\.glb$/i, '.usdz');
      usdzPath = usdzPath.replace(/\/models\/glb\//, '/models/usdz/');


      if (!overwrite && existsSync(usdzPath)) {
        console.log(`- Skip (exists): ${basename(usdzPath)}`);
        continue;
      }

      console.log(`- Convert: ${basename(glbPath)} -> ${basename(usdzPath)}`);
      await convertWithBlender(pythonScriptPath, glbPath, usdzPath);
    }

    console.log('USDZ conversion completed.');
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('USDZ conversion failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
