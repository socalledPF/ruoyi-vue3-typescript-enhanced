/**
* v-copyText 复制文本内容
* Copyright (c) 2022 ruoyi
*/
export default {
  beforeMount(el: HTMLElement, { value, arg }: DirectiveBinding) {
    const copyEl = el as CopyTextElement
    if (arg === "callback") {
      copyEl.$copyCallback = typeof value === 'function' ? value : undefined
    } else {
      copyEl.$copyValue = String(value ?? '')
      const handler = () => {
        copyTextToClipboard(copyEl.$copyValue)
        if (copyEl.$copyCallback) {
          copyEl.$copyCallback(copyEl.$copyValue)
        }
      }
      el.addEventListener("click", handler)
      copyEl.$destroyCopy = () => el.removeEventListener("click", handler)
    }
  }
}

interface CopyTextElement extends HTMLElement {
  $copyCallback?: (value: string) => void
  $copyValue: string
  $destroyCopy?: () => void
}

function copyTextToClipboard(input: string, { target = document.body }: { target?: HTMLElement } = {}): boolean {
  const element = document.createElement('textarea')
  const previouslyFocusedElement = document.activeElement as HTMLElement

  element.value = input

  // Prevent keyboard from showing on mobile
  element.setAttribute('readonly', '')

  element.style.contain = 'strict'
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.fontSize = '12pt' // Prevent zooming on iOS

  const selection = document.getSelection()
  const originalRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  target.append(element)
  element.select()

  // Explicit selection workaround for iOS
  element.selectionStart = 0
  element.selectionEnd = input.length

  let isSuccess = false
  try {
    isSuccess = document.execCommand('copy')
  } catch { }

  element.remove()

  if (originalRange && selection) {
    selection.removeAllRanges()
    selection.addRange(originalRange)
  }

  // Get focus back on the previously focused element, if present
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus()
  }

  return isSuccess
}
