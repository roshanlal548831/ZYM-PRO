import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

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

export default defineConfig({
  plugins: [react(), tailwindcss(), stripConsoleCalls()],
})
