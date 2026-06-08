<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Modal from './Modal.vue'

type Operator = '+' | '-' | '*' | '/'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const expression = ref('')
const error = ref<string | null>(null)

const display = computed(() => {
  if (error.value) return error.value
  return expression.value || '0'
})

watch(
  () => props.show,
  (v) => {
    if (v) {
      expression.value = ''
      error.value = null
    }
  }
)

function isOperator(ch: string): ch is Operator {
  return ch === '+' || ch === '-' || ch === '*' || ch === '/'
}

function tokenize(expr: string): Array<number | Operator> {
  const tokens: Array<number | Operator> = []
  let i = 0

  while (i < expr.length) {
    const ch = expr[i]
    if (ch === ' ') {
      i++
      continue
    }

    // Operator (with unary minus support)
    if (isOperator(ch)) {
      const prev = tokens[tokens.length - 1]
      const isUnaryMinus = ch === '-' && (tokens.length === 0 || typeof prev !== 'number')

      if (!isUnaryMinus) {
        tokens.push(ch)
        i++
        continue
      }
      // fallthrough to number parsing
    }

    // Number (optional unary minus)
    let start = i
    if (expr[i] === '-') i++
    let hasDot = false

    while (i < expr.length) {
      const c = expr[i]
      if (c === '.') {
        if (hasDot) break
        hasDot = true
        i++
        continue
      }
      if (c >= '0' && c <= '9') {
        i++
        continue
      }
      break
    }

    const raw = expr.slice(start, i)
    if (raw === '-' || raw === '' || raw === '.') throw new Error('Invalid number')

    const value = Number(raw)
    if (!Number.isFinite(value)) throw new Error('Invalid number')
    tokens.push(value)
  }

  return tokens
}

function precedence(op: Operator): number {
  return op === '*' || op === '/' ? 2 : 1
}

function applyOp(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      if (b === 0) throw new Error('Division by zero')
      return a / b
  }
}

function evaluateExpression(expr: string): number {
  const tokens = tokenize(expr)
  const values: number[] = []
  const ops: Operator[] = []

  for (const t of tokens) {
    if (typeof t === 'number') {
      values.push(t)
      continue
    }

    const op = t
    while (ops.length) {
      const top = ops[ops.length - 1]
      if (precedence(top) >= precedence(op)) {
        const b = values.pop()
        const a = values.pop()
        if (a === undefined || b === undefined) throw new Error('Invalid expression')
        values.push(applyOp(a, b, top))
        ops.pop()
      } else {
        break
      }
    }

    ops.push(op)
  }

  while (ops.length) {
    const b = values.pop()
    const a = values.pop()
    if (a === undefined || b === undefined) throw new Error('Invalid expression')
    values.push(applyOp(a, b, ops.pop() as Operator))
  }

  if (values.length !== 1) throw new Error('Invalid expression')
  return values[0]
}

function appendDigit(digit: string) {
  error.value = null
  if (!digit) return

  if (digit === '.') {
    // Prevent multiple dots in the current number segment
    const lastOpIdx = Math.max(
      expression.value.lastIndexOf('+'),
      expression.value.lastIndexOf('-'),
      expression.value.lastIndexOf('*'),
      expression.value.lastIndexOf('/')
    )
    const segment = expression.value.slice(lastOpIdx + 1)
    if (segment.includes('.')) return
  }

  if (expression.value === '' && digit === '.') {
    expression.value = '0.'
    return
  }

  if (digit !== '.' && expression.value === '0') {
    expression.value = digit
    return
  }

  expression.value += digit
}

function appendOperator(op: Operator) {
  error.value = null

  if (!expression.value) {
    if (op === '-') expression.value = '-'
    return
  }

  const last = expression.value.slice(-1)
  if (isOperator(last)) {
    expression.value = expression.value.slice(0, -1) + op
    return
  }

  expression.value += op
}

function backspace() {
  error.value = null
  expression.value = expression.value.slice(0, -1)
}

function clearAll() {
  expression.value = ''
  error.value = null
}

function equals() {
  error.value = null
  const expr = expression.value.trim()
  if (!expr) return

  try {
    const res = evaluateExpression(expr)
    expression.value = Number.isInteger(res) ? String(res) : String(Number(res.toFixed(10)))
  } catch (e) {
    expression.value = ''
    error.value = e instanceof Error ? e.message : 'Invalid expression'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.show) return

  const key = e.key
  const lower = key.toLowerCase()

  if (key === 'Escape') {
    e.preventDefault()
    emit('close')
    return
  }

  if (key === 'Enter' || key === '=') {
    e.preventDefault()
    equals()
    return
  }

  if (key === 'Backspace') {
    e.preventDefault()
    backspace()
    return
  }

  if ((key >= '0' && key <= '9') || key === '.') {
    e.preventDefault()
    appendDigit(key)
    return
  }

  if (isOperator(key)) {
    e.preventDefault()
    appendOperator(key)
    return
  }

  // Some keyboards send 'x' for multiplication
  if (lower === 'x') {
    e.preventDefault()
    appendOperator('*')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Modal :show="show" title="Calculator" size="sm" @close="emit('close')">
    <div class="space-y-4">
      <div class="glass-card p-4">
        <div class="text-xs text-surface-500 mb-1">Quick calc</div>
        <div class="text-2xl font-semibold text-surface-100 tracking-wide break-all">
          {{ display }}
        </div>
        <div class="text-xs text-surface-500 mt-1">
          Supports only <span class="text-surface-200">+ - * /</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <button
          class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors"
          type="button"
          @click="clearAll"
        >C</button>
        <button
          class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors"
          type="button"
          @click="backspace"
        >⌫</button>
        <button
          class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors"
          type="button"
          @click="appendOperator('/')"
        >/</button>
        <button
          class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors"
          type="button"
          @click="appendOperator('*')"
        >*</button>

        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('7')">7</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('8')">8</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('9')">9</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendOperator('-')">-</button>

        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('4')">4</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('5')">5</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('6')">6</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendOperator('+')">+</button>

        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('1')">1</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('2')">2</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('3')">3</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="equals">=</button>

        <button
          class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors col-span-2"
          type="button"
          @click="appendDigit('0')"
        >0</button>
        <button class="px-3 py-3 rounded-lg border border-surface-600 bg-surface-800/60 text-surface-200 hover:bg-surface-800 transition-colors" type="button" @click="appendDigit('.')">.</button>
      </div>
    </div>
  </Modal>
</template>

