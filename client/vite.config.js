import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const traverse = traverseModule.default
const consoleCallPattern = /\bconsole\s*(?:\?\.)?\.\s*(?:log|debug|info|warn|error|trace|table|group|groupCollapsed|groupEnd|time|timeEnd|timeLog|dir|dirxml|assert|count|countReset|clear|profile|profileEnd)\s*(?:\?\.)?\s*\(/

function stripConsoleCalls() {
  return {
    name: 'strip-production-console-calls',
    apply: 'build',
    renderChunk(code) {
      if (!consoleCallPattern.test(code) && !/\bdebugger\b/.test(code)) return null
      const ast = parse(code, { sourceType: 'unambiguous', allowReturnOutsideFunction: true })
      const removals = []
      const isConsoleCall = (callee) => (
        (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression')
        && callee.object.type === 'Identifier'
        && callee.object.name === 'console'
      )
      traverse(ast, {
        CallExpression(path) {
          if (isConsoleCall(path.node.callee)) removals.push([path.node.start, path.node.end])
        },
        OptionalCallExpression(path) {
          if (isConsoleCall(path.node.callee)) removals.push([path.node.start, path.node.end])
        },
        DebuggerStatement(path) {
          removals.push([path.node.start, path.node.end])
        },
      })
      if (!removals.length) return null
      let output = code
      for (const [start, end] of removals.sort((a, b) => b[0] - a[0])) {
        output = output.slice(0, start) + 'void 0' + output.slice(end)
      }
      return { code: output, map: null }
    },
  }
}

function configureVendorRuntimeApiUrl(apiUrl) {
  return {
    name: 'configure-vendor-runtime-api-url',
    enforce: 'pre',
    transform(code, id) {
      const normalizedId = id.replaceAll('\\', '/')
      if (!normalizedId.includes('/vendor-admin-runtime/')) return null
      const updatedCode = code.replaceAll('http://localhost:4000/api/v1', apiUrl)
      return updatedCode === code ? null : { code: updatedCode, map: null }
    },
  }
}

export default defineConfig(({ mode }) => {
  const { VITE_API_BASE_URL } = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = VITE_API_BASE_URL?.trim() || 'http://localhost:4000/api/v1'

  return {
    plugins: [react(), tailwindcss(), configureVendorRuntimeApiUrl(apiUrl), stripConsoleCalls()],
  }
})
