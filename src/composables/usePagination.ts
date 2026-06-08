import { computed, ref, watch, type Ref } from 'vue'

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export function usePagination<T>(items: Ref<T[]>, defaultPageSize: PageSizeOption = 10) {
  const pageSize = ref<PageSizeOption>(defaultPageSize)
  const currentPage = ref(1)

  const totalItems = computed(() => items.value.length)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  )

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })

  const rangeStart = computed(() =>
    totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
  )

  const rangeEnd = computed(() =>
    Math.min(currentPage.value * pageSize.value, totalItems.value)
  )

  watch(pageSize, () => {
    currentPage.value = 1
  })

  watch(totalPages, (pages) => {
    if (currentPage.value > pages) currentPage.value = pages
  })

  function goToPage(page: number) {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  function resetPage() {
    currentPage.value = 1
  }

  return {
    pageSize,
    currentPage,
    totalItems,
    totalPages,
    paginatedItems,
    rangeStart,
    rangeEnd,
    goToPage,
    resetPage,
  }
}
