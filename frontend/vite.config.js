import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

// Live shuffle-security source in dev, same as the cloud frontend (shaffuru), so the
// agent UI behaves identically on-prem. SHUFFLE_LIBS=npm yarn start uses the npm packages.
const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const securityDir = path.resolve(frontendDir, process.env.SHUFFLE_SECURITY_DIR || '../../shuffle-security')
const securitySrc = path.join(securityDir, 'src')
const coreDir = path.join(securitySrc, 'Shuffle-Core')
const mcpsDir = path.join(securitySrc, 'Shuffle-MCPs')

const conflictingDeps = ['algoliasearch', 'react-markdown', 'remark-gfm']

const pickExport = (entry) =>
  typeof entry === 'string' ? entry : entry && (pickExport(entry.browser) || pickExport(entry.import) || pickExport(entry.default))

const nestedDepEntry = (pkg, name) => {
  const dir = path.join(frontendDir, 'node_modules/@shuffleio', pkg, 'node_modules', name)
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    return null
  }
  const json = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  return path.join(dir, pickExport(json.exports?.['.'] ?? json.exports) || json.module || json.main || 'index.js')
}

const localShuffleLibs = () => ({
  name: 'shuffle-local-libs',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer?.startsWith(securitySrc)) {
      return null
    }
    const isMcps = importer.startsWith(mcpsDir)
    if (conflictingDeps.includes(source)) {
      return this.resolve(`shuffle-local-dep/${isMcps ? 'shuffle-mcps' : 'shuffle-core'}/${source}`, importer, { skipSelf: true })
    }
    if (/^(@capacitor|firebase)\//.test(source)) {
      return path.join(isMcps ? mcpsDir : coreDir, 'shims', source.startsWith('firebase/') ? 'firebase-shim.ts' : 'capacitor-shim.ts')
    }
    return null
  },
})

const localDepAliases = () =>
  ['shuffle-core', 'shuffle-mcps'].flatMap((pkg) =>
    conflictingDeps
      .map((name) => ({ id: `shuffle-local-dep/${pkg}/${name}`, entry: nestedDepEntry(pkg, name) }))
      .filter((dep) => dep.entry)
  )

const localLibsConfig = () => ({
  plugins: [localShuffleLibs()],
  optimizeDeps: {
    include: localDepAliases().map((dep) => dep.id),
  },
  resolve: {
    alias: [
      ...localDepAliases().map((dep) => ({ find: new RegExp(`^${dep.id}$`), replacement: dep.entry })),
      { find: /^@shuffleio\/shuffle-core$/, replacement: path.join(coreDir, 'index.tsx') },
      { find: /^@shuffleio\/shuffle-mcps$/, replacement: path.join(mcpsDir, 'index.ts') },
      { find: /^@\/lib\/router-compat$/, replacement: 'react-router-dom' },
      { find: /^@\//, replacement: `${securitySrc}/` },
    ],
    dedupe: [
      'react',
      'react-dom',
      'react-router',
      'react-router-dom',
      '@mui/material',
      '@mui/system',
      '@mui/icons-material',
      '@mui/x-data-grid',
      '@emotion/react',
      '@emotion/styled',
      '@tanstack/react-query',
      'react-toastify',
      // CodeMirror breaks (instanceof checks) when the host and shuffle-security each load a copy
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/language',
      '@lezer/common',
      '@lezer/highlight',
      '@uiw/react-codemirror',
    ],
  },
  server: {
    fs: { allow: [frontendDir, securityDir] },
  },
})

// On-prem keeps JSX in plain .js files. Forcing esbuild's loader to 'jsx' for those would also
// stop it compiling the TypeScript in shuffle-security, so live-source mode does it per file instead.
const jsxInJs = () => ({
  name: 'onprem-jsx-in-js',
  enforce: 'pre',
  transform(code, id) {
    if (!id.startsWith(path.join(frontendDir, 'src')) || !/\.js$/.test(id)) {
      return null
    }
    return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
  },
})

export default defineConfig(({ command }) => {
  const useLocalLibs =
    command === 'serve' &&
    process.env.SHUFFLE_LIBS !== 'npm' &&
    fs.existsSync(path.join(coreDir, 'index.tsx')) &&
    fs.existsSync(path.join(mcpsDir, 'index.ts'))
  const localLibs = useLocalLibs ? localLibsConfig() : { plugins: [], resolve: {}, server: {}, optimizeDeps: {} }
  if (useLocalLibs) {
    console.log(`[shuffle-libs] Using live source from ${securityDir} (SHUFFLE_LIBS=npm yarn start to use npm packages)`)
  }

  return {
    plugins: [...localLibs.plugins, ...(useLocalLibs ? [jsxInJs()] : []), react()],
    resolve: localLibs.resolve,
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        }
      },
      ...localLibs.server,
    },
    build: {
      outDir: 'build',
      sourcemap: false,
    },
    esbuild: useLocalLibs ? undefined : {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      include: localLibs.optimizeDeps.include,
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  }
})
