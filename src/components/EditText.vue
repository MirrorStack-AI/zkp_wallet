<template>
  <div class="relative">
    <div 
      class="relative flex items-center border border-outline-variant rounded-lg hover:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-colors bg-surface-container-low"
      :class="{ 'border-error': hasError }"
    >
      <!-- Textarea -->
      <textarea
        v-if="textarea"
        :id="uniqueId"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        class="peer w-full rounded-lg px-4 py-4 bg-transparent border-0 outline-none text-on-surface focus:text-primary transition-colors resize-none"
        :placeholder="computedPlaceholder"
        :required="required"
        :minlength="minlength"
        :maxlength="maxlength"
        :disabled="disabled"
        :rows="rows"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup="$emit('keyup', $event)"
        @keydown="$emit('keydown', $event)"
      />
      
      <!-- Input -->
      <input
        v-else
        :type="inputType"
        :id="uniqueId"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="peer w-full rounded-lg px-4 py-4 bg-transparent border-0 outline-none text-on-surface focus:text-primary transition-colors"
        :placeholder="computedPlaceholder"
        :required="required"
        :minlength="minlength"
        :maxlength="maxlength"
        :disabled="disabled"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup="$emit('keyup', $event)"
        @keydown="$emit('keydown', $event)"
      />
      
      <label
        :for="uniqueId"
        class="absolute text-base z-10 font-normal text-on-surface-variant left-4 top-4 px-1 bg-surface-container-low rounded-md transition-all duration-200 ease-in-out origin-top-left pointer-events-none 
               peer-focus:scale-75 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-3 peer-focus:text-primary 
               peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:left-3"
        :class="{ 'text-error': hasError }"
      >
        {{ label }}
      </label>
      
      <!-- Password toggle button (only for password type and input) -->
      <button
        v-if="inputType === 'password' && !textarea"
        type="button"
        @click="togglePasswordVisibility"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" v-if="showPassword">
          <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" v-else>
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage && showError" class="mt-1 text-sm text-error">
      {{ errorMessage }}
    </div>
    
    <!-- Helper text -->
    <div v-if="helperText" class="mt-1 text-sm text-on-surface-variant">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  minlength?: number
  maxlength?: number
  errorMessage?: string
  helperText?: string
  id?: string
  textarea?: boolean
  rows?: number
  focusOnlyPlaceholder?: boolean
  showError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: ' ',
  required: false,
  disabled: false,
  id: undefined,
  textarea: false,
  rows: 3,
  focusOnlyPlaceholder: false,
  showError: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': []
  'blur': []
  'keyup': [event: KeyboardEvent]
  'keydown': [event: KeyboardEvent]
}>()

// Password visibility toggle
const showPassword = ref(false)
const isFocused = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const hasError = computed(() => !!props.errorMessage)

const computedPlaceholder = computed(() => {
  if (props.focusOnlyPlaceholder) {
    return isFocused.value ? props.placeholder : ''
  }
  return props.placeholder
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

// Generate unique ID if not provided
const uniqueId = computed(() => {
  return props.id || `edittext-${Math.random().toString(36).substr(2, 9)}`
})
</script>

<style scoped>
/* Remove explicit focus outline/border change */
input:focus, textarea:focus {
  outline: none; 
}

input, textarea {
  transition: all 0.2s ease;
}

/* Animation for label */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.absolute.z-10 {
  animation: fadeIn 0.2s ease-out;
}
</style> 