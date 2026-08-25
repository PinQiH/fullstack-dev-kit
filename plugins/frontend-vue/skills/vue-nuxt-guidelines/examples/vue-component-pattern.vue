<!--
 * examples/vue-component-pattern.vue
 *
 * 核心元件開發規範 (SFC Structure Pattern)
 * 在 Vue 3 <script setup> 內，程式碼區段的排列須遵守特定次序，減少認知負擔。
-->

<script setup lang="ts">
// ----------------------------------------------------
// 1. import 區 (外部套件、元件、Service)
// ----------------------------------------------------
import { ref, computed, watch, onMounted, inject } from 'vue'
import { UserService } from '@/services/UserService'
import BaseButton from '@/components/BaseButton.vue'

// ----------------------------------------------------
// 2. defineProps / defineEmits / defineExpose
// ----------------------------------------------------
const props = defineProps<{
  userId: string
}>()

const emit = defineEmits<{
  (e: 'update', id: string): void
}>()

// ----------------------------------------------------
// 3. inject / provide
// ----------------------------------------------------
const themeContext = inject('theme', 'light')

// ----------------------------------------------------
// 4. Composables (useXxx)
// ----------------------------------------------------
const { user, fetchUser, isLoading } = useUserProfile()

// ----------------------------------------------------
// 5. ref / reactive 狀態
// ----------------------------------------------------
const localCounter = ref(0)

// ----------------------------------------------------
// 6. computed 計算屬性
// ----------------------------------------------------
const isReady = computed(() => {
  if (!user.value) return false // 防守性設計：處理 Null Guard
  return !isLoading.value
})

const greetingMessage = computed(() => {
  return `Hi, ${user.value?.fullName || '訪客'}`
})

// ----------------------------------------------------
// 7. watch / watchEffect 監聽器
// ----------------------------------------------------
watch(() => props.userId, (newId) => {
  if (newId) fetchUser(newId)
})

// ----------------------------------------------------
// 8. Lifecycle Hooks
// ----------------------------------------------------
onMounted(() => {
  fetchUser(props.userId)
})

// ----------------------------------------------------
// 9. 一般函數 (事件處理、業務邏輯)
// ----------------------------------------------------
const handleUpdate = () => {
  localCounter.value++
  emit('update', props.userId)
}
</script>

<template>
  <div class="user-profile">
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="!user">查無使用者</div>
    <div v-else>
      <h1>{{ greetingMessage }}</h1>
      <BaseButton aria-label="更新資料" @click="handleUpdate">修改資料</BaseButton>
    </div>
  </div>
</template>

<style scoped>
/* 避免在這裡寫太多通用設定，應善用 class tokens 處理 */
.user-profile {
  padding: 1rem;
}
</style>
