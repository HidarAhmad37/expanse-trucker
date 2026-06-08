<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budgets'
import { useTransactionStore } from '@/stores/transactions'
import { formatBase, getMonthName } from '@/utils/format'
import BudgetList from '@/components/budgets/BudgetList.vue'
import BudgetForm from '@/components/budgets/BudgetForm.vue'
import CategoryList from '@/components/categories/CategoryList.vue'
import CategoryForm from '@/components/categories/CategoryForm.vue'
import CategorySelect from '@/components/ui/CategorySelect.vue'
import TabBar from '@/components/ui/TabBar.vue'
import Modal from '@/components/ui/Modal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Budget, Category } from '@/types'
import { Plus, ChevronLeft, ChevronRight, PiggyBank, Tags } from '@lucide/vue'

const budgetStore = useBudgetStore()
const txStore = useTransactionStore()

const activeTab = ref<'budgets' | 'categories'>('budgets')

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const showAddBudgetModal = ref(false)
const editingBudget = ref<Budget | null>(null)
const filterCategory = ref('')

const showAddCategoryModal = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryFilterType = ref<'all' | 'income' | 'expense'>('all')

const monthLabel = computed(() => `${getMonthName(selectedMonth.value)} ${selectedYear.value}`)

const summary = computed(() =>
  txStore.getMonthlySummary(selectedYear.value, selectedMonth.value)
)

const spentByCategory = computed(() => {
  const map = new Map<string, number>()
  summary.value.byCategory.forEach(item => map.set(item.category.id, item.amount))
  return map
})

const filteredBudgets = computed(() => {
  if (!filterCategory.value) return budgetStore.budgets
  return budgetStore.budgets.filter(b => b.category_id === filterCategory.value)
})

const filteredCategories = computed(() => {
  if (categoryFilterType.value === 'all') return txStore.categories
  return txStore.categories.filter(c => c.type === categoryFilterType.value)
})

const totals = computed(() => {
  const totalLimit = budgetStore.budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = budgetStore.budgets.reduce((s, b) => {
    return s + (spentByCategory.value.get(b.category_id) ?? 0)
  }, 0)
  return { totalLimit, totalSpent, remaining: totalLimit - totalSpent }
})

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
  loadBudgetData()
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
  loadBudgetData()
}

async function loadBudgetData() {
  filterCategory.value = ''
  const start = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
  const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  const end = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`
  await Promise.all([
    txStore.fetchCategories(),
    txStore.fetchTransactions(start, end),
    budgetStore.fetchBudgets(selectedMonth.value, selectedYear.value),
  ])
}

async function handleDeleteBudget(id: string) {
  await budgetStore.deleteBudget(id)
}

async function handleDeleteCategory(id: string) {
  const { error } = await txStore.deleteCategory(id)
  if (error) {
    alert(error.message)
    return
  }
  await budgetStore.fetchBudgets(selectedMonth.value, selectedYear.value)
}

function openEditBudget(budget: Budget) {
  editingBudget.value = budget
}

function openEditCategory(category: Category) {
  editingCategory.value = category
}

function closeBudgetModal() {
  showAddBudgetModal.value = false
  editingBudget.value = null
}

function closeCategoryModal() {
  showAddCategoryModal.value = false
  editingCategory.value = null
}

onMounted(async () => {
  await txStore.fetchCategories()
  await loadBudgetData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-100">Budgets & Categories</h1>
        <p class="text-surface-500 mt-1">
          {{ activeTab === 'budgets'
            ? 'Manage monthly spending limits per category (AFN)'
            : 'View and manage all your income and expense categories' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="activeTab === 'budgets'">
          <div class="flex items-center gap-1 glass rounded-xl px-2 py-1">
            <button class="p-2 rounded-lg hover:bg-surface-700" @click="prevMonth">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm font-medium px-2 min-w-[160px] text-center">{{ monthLabel }}</span>
            <button class="p-2 rounded-lg hover:bg-surface-700" @click="nextMonth">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <button class="btn-primary flex items-center gap-2" @click="showAddBudgetModal = true">
            <Plus class="w-4 h-4" />
            Add Budget
          </button>
        </template>
        <button
          v-else
          class="btn-primary flex items-center gap-2"
          @click="showAddCategoryModal = true"
        >
          <Plus class="w-4 h-4" />
          Add Category
        </button>
      </div>
    </div>

    <TabBar
      v-model="activeTab"
      :tabs="[
        { id: 'budgets', label: 'Budgets' },
        { id: 'categories', label: 'Categories' },
      ]"
    />

    <!-- Budgets tab -->
    <div v-if="activeTab === 'budgets'" class="space-y-6">
      <div v-if="budgetStore.budgets.length" class="glass-card p-4 max-w-xs">
        <label class="label">Category</label>
        <CategorySelect
          v-model="filterCategory"
          mode="expense-all"
          :month="selectedMonth"
          :year="selectedYear"
          :required="false"
          placeholder="All categories"
        />
      </div>

      <div v-if="budgetStore.budgets.length" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card p-4">
          <p class="text-sm text-surface-500">Total Budget</p>
          <p class="text-xl font-bold text-surface-100">{{ formatBase(totals.totalLimit) }}</p>
        </div>
        <div class="glass-card p-4">
          <p class="text-sm text-surface-500">Total Spent</p>
          <p class="text-xl font-bold text-red-400">{{ formatBase(totals.totalSpent) }}</p>
        </div>
        <div class="glass-card p-4">
          <p class="text-sm text-surface-500">Remaining</p>
          <p
            class="text-xl font-bold"
            :class="totals.remaining >= 0 ? 'text-emerald-400' : 'text-red-400'"
          >
            {{ formatBase(totals.remaining) }}
          </p>
        </div>
      </div>

      <BudgetList
        v-if="filteredBudgets.length"
        :budgets="filteredBudgets"
        :spent-by-category="spentByCategory"
        @edit="openEditBudget"
        @delete="handleDeleteBudget"
      />

      <EmptyState
        v-else-if="!budgetStore.budgets.length"
        title="No budgets for this month"
        description="Add spending limits for your expense categories"
      >
        <template #icon>
          <PiggyBank class="w-8 h-8 text-surface-500" />
        </template>
        <template #action>
          <button class="btn-primary" @click="showAddBudgetModal = true">Add Budget</button>
        </template>
      </EmptyState>

      <EmptyState
        v-else
        title="No matching budgets"
        description="Try a different category filter"
      >
        <template #icon>
          <PiggyBank class="w-8 h-8 text-surface-500" />
        </template>
      </EmptyState>
    </div>

    <!-- Categories tab -->
    <div v-else class="space-y-6">
      <div class="flex gap-2 p-1 bg-surface-800 rounded-xl w-fit">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="categoryFilterType === 'all'
            ? 'bg-brand-600/20 text-brand-400'
            : 'text-surface-400 hover:text-surface-200'"
          @click="categoryFilterType = 'all'"
        >
          All ({{ txStore.categories.length }})
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="categoryFilterType === 'expense'
            ? 'bg-red-500/20 text-red-400'
            : 'text-surface-400 hover:text-surface-200'"
          @click="categoryFilterType = 'expense'"
        >
          Expense ({{ txStore.expenseCategories.length }})
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="categoryFilterType === 'income'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-surface-400 hover:text-surface-200'"
          @click="categoryFilterType = 'income'"
        >
          Income ({{ txStore.incomeCategories.length }})
        </button>
      </div>

      <CategoryList
        v-if="filteredCategories.length"
        :categories="filteredCategories"
        @edit="openEditCategory"
        @delete="handleDeleteCategory"
      />

      <EmptyState
        v-else
        title="No categories yet"
        description="Create income and expense categories to organize your transactions"
      >
        <template #icon>
          <Tags class="w-8 h-8 text-surface-500" />
        </template>
        <template #action>
          <button class="btn-primary" @click="showAddCategoryModal = true">Add Category</button>
        </template>
      </EmptyState>
    </div>

    <Modal :show="showAddBudgetModal" title="Add Budget" @close="closeBudgetModal">
      <BudgetForm
        :month="selectedMonth"
        :year="selectedYear"
        @saved="closeBudgetModal(); loadBudgetData()"
        @cancel="closeBudgetModal"
      />
    </Modal>

    <Modal :show="!!editingBudget" title="Edit Budget" @close="closeBudgetModal">
      <BudgetForm
        :budget="editingBudget"
        :month="selectedMonth"
        :year="selectedYear"
        @saved="closeBudgetModal(); loadBudgetData()"
        @cancel="closeBudgetModal"
      />
    </Modal>

    <Modal :show="showAddCategoryModal" title="Add Category" @close="closeCategoryModal">
      <CategoryForm
        @saved="closeCategoryModal()"
        @cancel="closeCategoryModal"
      />
    </Modal>

    <Modal :show="!!editingCategory" title="Edit Category" @close="closeCategoryModal">
      <CategoryForm
        :category="editingCategory"
        @saved="closeCategoryModal()"
        @cancel="closeCategoryModal"
      />
    </Modal>
  </div>
</template>
