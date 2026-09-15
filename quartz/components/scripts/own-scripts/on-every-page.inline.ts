function setupProgressWidgets() {
  const currentPath = window.location.pathname
  const validInputIdsOnPage = setupTrackedInputs(currentPath)

  // 1. Cleanup old local widget (if exists from previous nav)
  const existingLocal = document.getElementById("local-progress-widget")
  if (existingLocal) existingLocal.remove()

  // 2. Identify Checkboxes & PRE-LOAD STATE
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"]',
  ) as NodeListOf<HTMLInputElement>
  const relevantCheckboxes: HTMLInputElement[] = []
  const validIdsOnPage = new Set<string>()

  checkboxes.forEach((cb) => {
    // Skip checkboxes in TOC or Footer
    if (cb.closest(".table-of-contents") || cb.closest("footer")) return

    const text = cb.parentElement?.innerText.trim()
    if (text) {
      const uniqueId = `${currentPath}::${text}`

      // Store ID
      cb.dataset.taskId = uniqueId
      validIdsOnPage.add(uniqueId)

      // --- FIX: LOAD STATE NOW (Before calculating score) ---
      // We also enable the checkbox here so it's ready for interaction
      if (cb.disabled) cb.removeAttribute("disabled")
      cb.checked = localStorage.getItem(uniqueId) === "true"

      relevantCheckboxes.push(cb)
    }
  })

  // 3. Garbage Collection (Clean up old keys for this page)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`${currentPath}::`)) {
      const isInputKey = key.startsWith(`${currentPath}::input::`)
      const isValidInputKey = validInputIdsOnPage.has(key)
      const isValidCheckboxKey = validIdsOnPage.has(key)

      if ((isInputKey && !isValidInputKey) || (!isInputKey && !isValidCheckboxKey)) {
        localStorage.removeItem(key)
        i--
      }
    }
  }

  // 4. Create & Inject Local Widget
  const total = relevantCheckboxes.length

  if (total > 0) {
    const widget = document.createElement("div")
    widget.id = "local-progress-widget"
    widget.innerHTML = `
      <div class="progress-label">
        <span>Progress</span>
        <span class="progress-text">0%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill"></div>
        <div class="progress-ticks" style="--total-tasks: ${total};"></div>
      </div>
    `

    const content = document.querySelector(".popover-hint") || document.querySelector("article")
    if (content) content.appendChild(widget)

    // --- INITIAL UPDATE ---
    // Now that checkboxes are hydrated, this will show the correct % immediately
    updateLocalState(relevantCheckboxes, widget)
  }

  // 6. Bind Event Listeners
  // (We already loaded state in step 2, now we just watch for changes)
  relevantCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.taskId
      if (id) {
        if (cb.checked) {
          localStorage.setItem(id, "true")
        } else {
          localStorage.removeItem(id)
        }

        // Update UI
        const widget = document.getElementById("local-progress-widget")
        if (widget) updateLocalState(relevantCheckboxes, widget)
        updateGlobalWidget()
        updateHeaderStyles()
      }
    })
  })
}

function setupTrackedInputs(currentPath: string): Set<string> {
  const markers = document.querySelectorAll(
    "article span.track-input",
  ) as NodeListOf<HTMLSpanElement>
  const validInputIdsOnPage = new Set<string>()

  markers.forEach((marker, index) => {
    const markerKey = deriveTrackedInputKey(marker, index)
    const storageKey = `${currentPath}::input::${markerKey}`
    validInputIdsOnPage.add(storageKey)

    if (marker.dataset.initialized === "true") return
    marker.dataset.initialized = "true"

    const kind = marker.dataset.kind === "number" ? "number" : "text"
    const label = marker.dataset.label?.trim()

    marker.textContent = ""
    marker.style.display = "inline-flex"
    marker.style.alignItems = "center"
    marker.style.gap = "0.25rem"
    marker.style.marginInlineStart = "0.35rem"

    if (label) {
      const labelEl = document.createElement("span")
      labelEl.textContent = `${label}:`
      labelEl.style.fontSize = "0.85em"
      marker.appendChild(labelEl)
    }

    const input = document.createElement("input")
    input.type = kind
    input.className = "track-input-field"
    input.placeholder = marker.dataset.placeholder?.trim() ?? ""
    input.setAttribute("aria-label", label || "Tracked challenge metric")
    input.style.width = kind === "number" ? "5.5rem" : "7rem"
    input.style.padding = "0.05rem 0.25rem"
    input.style.fontSize = "0.85em"

    if (kind === "number") {
      if (marker.dataset.min) input.min = marker.dataset.min
      if (marker.dataset.max) input.max = marker.dataset.max
      if (marker.dataset.step) input.step = marker.dataset.step
    }

    const savedValue = localStorage.getItem(storageKey)
    if (savedValue !== null) input.value = savedValue

    input.addEventListener("input", () => {
      const value = input.value.trim()
      if (value === "") {
        localStorage.removeItem(storageKey)
      } else {
        localStorage.setItem(storageKey, value)
      }
    })

    marker.appendChild(input)
  })

  return validInputIdsOnPage
}

function deriveTrackedInputKey(marker: HTMLSpanElement, index: number): string {
  const explicitKey = marker.dataset.key?.trim()
  if (explicitKey) return sanitizeTrackedInputKey(explicitKey)

  const contextText = marker.closest("li, p, blockquote, div")?.textContent?.trim() ?? ""
  const normalizedContext = contextText.replace(/\s+/g, " ")
  const fallback = normalizedContext || `tracked-input-${index + 1}`

  return sanitizeTrackedInputKey(`${fallback}-${index + 1}`)
}

function sanitizeTrackedInputKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

// helper function for local progess bar
function updateLocalState(checkboxes: HTMLInputElement[], widget: HTMLElement) {
  const total = checkboxes.length
  const checkedCount = checkboxes.filter((cb) => cb.checked).length
  const percentage = total === 0 ? 0 : Math.round((checkedCount / total) * 100)

  const progressFill = widget.querySelector(".progress-fill") as HTMLElement
  const progressText = widget.querySelector(".progress-text") as HTMLElement

  if (progressFill && progressText) {
    progressFill.style.width = `${percentage}%`
    progressText.innerText = `${checkedCount}/${total} (${percentage}%)`

    if (percentage === 100) {
      progressFill.style.backgroundColor = "var(--tertiary)"
    } else {
      progressFill.style.backgroundColor = "var(--secondary)"
    }
  }
}

function setupGlobalProgress() {
  if (window.location.pathname === "/" || window.location.pathname === "/index") {
    console.log("display global progress")
    injectGlobalWidget()
  }
}

function injectGlobalWidget() {
  // Calculate total completed items from LocalStorage
  // Note: This assumes only checkboxes are stored as 'true' in LS.
  // A true "Global %" is hard in static sites without a build index,
  // so we display "Total Quests Completed".

  const container = document.querySelector("article") // Append to main content
  if (!container || document.getElementById("global-progress-widget")) return

  const widget = document.createElement("div")
  widget.id = "global-progress-widget"
  container.prepend(widget) // Add to top of index page

  updateGlobalWidget()
}

function updateGlobalWidget() {
  const widget = document.getElementById("global-progress-widget")
  if (!widget) return

  let totalCompleted = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && localStorage.getItem(key) === "true") {
      totalCompleted++
    }
  }

  widget.innerText = `🏆 Overall number of challenges completed: ${totalCompleted}`
}

function updateHeaderStyles() {
  // Get all H2 headers
  const headers = document.querySelectorAll("article h2")

  headers.forEach((header) => {
    // Find the next sibling elements until the next H2
    const sectionElements: Element[] = []
    let nextSibling = header.nextElementSibling

    while (nextSibling && nextSibling.tagName !== "H2") {
      sectionElements.push(nextSibling)
      nextSibling = nextSibling.nextElementSibling
    }

    // Find all checkboxes in this section
    const sectionCheckboxes = Array.from(sectionElements).flatMap(
      (el) => Array.from(el.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[],
    )

    // If there are checkboxes in this section
    if (sectionCheckboxes.length > 0) {
      // Check if all checkboxes are checked
      const allChecked = sectionCheckboxes.every((checkbox) => checkbox.checked)

      // Add or remove the 'all-checked' class based on the check state
      if (allChecked) {
        header.classList.add("all-checked")
      } else {
        header.classList.remove("all-checked")
      }
    }
  })
}

function setupFolding() {
  // Select all H2s inside the main article content
  // We use the "article" selector to avoid targeting headers in sidebars/footers
  const headers = document.querySelectorAll("article h2")

  headers.forEach((header) => {
    // 1. Add the arrow icon
    // Check if icon already exists (to prevent duplicates on re-renders)
    if (header.querySelector(".fold-icon")) return

    const icon = document.createElement("span")
    icon.classList.add("fold-icon")
    icon.innerText = "▼" // You can also use an SVG here
    header.prepend(icon)

    // 2. Add class for styling
    header.classList.add("foldable")

    // 3. Identify content to fold
    // We gather all next siblings until we hit another H2 or end of container
    const contentElements: Element[] = []
    let nextSibling = header.nextElementSibling

    while (nextSibling && nextSibling.tagName !== "H2" && nextSibling.tagName !== "H1") {
      contentElements.push(nextSibling)
      nextSibling = nextSibling.nextElementSibling
    }

    // 4. Set Default State: Folded (Hidden)
    // We do NOT add the 'expanded' class, and we ADD 'content-hidden'
    contentElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.add("content-hidden")
      }
    })

    // 5. Add Click Event
    header.addEventListener("click", () => {
      const isExpanded = header.classList.contains("expanded")

      if (isExpanded) {
        // Collapse
        header.classList.remove("expanded")
        contentElements.forEach((el) => el.classList.add("content-hidden"))
      } else {
        // Expand
        header.classList.add("expanded")
        contentElements.forEach((el) => el.classList.remove("content-hidden"))
      }
    })
  })
}

// Run on initial load and navigation
document.addEventListener("nav", () => {
  setupProgressWidgets()
  setupGlobalProgress()
  setupFolding()
  updateHeaderStyles()

  // Handle video overlay clicks
  const overlay = document.querySelector<HTMLElement>(".video-overlay")!
  const video = overlay.querySelector<HTMLVideoElement>("video")!
  const closeBtn = overlay.querySelector<HTMLElement>(".close-btn")!

  // Close when clicking the close button
  closeBtn.addEventListener("click", () => {
    video.pause()
    video.currentTime = 0
    video.src = ""
    overlay.classList.remove("active")
  })

  // Close when clicking outside the video
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      video.pause()
      video.currentTime = 0
      video.src = ""
      overlay.classList.remove("active")
    }
  })
})

document.addEventListener("click", (e: MouseEvent) => {
  const videoBtn = (e.target as HTMLElement).closest(".video-popup")
  if (!videoBtn) return

  const videoPath = getSafeVideoPath(videoBtn)
  if (!videoPath) return

  e.preventDefault()
  const overlay = document.querySelector<HTMLElement>(".video-overlay")!
  const video = overlay.querySelector<HTMLVideoElement>("video")!

  video.src = `./attachments/Videos/${videoPath}`
  overlay.classList.add("active")
  video.play().catch(console.error)
})

function getSafeVideoPath(videoBtn: Element): string | null {
  const videoPath = videoBtn.getAttribute("data-video")?.trim()
  if (!videoPath) return null

  if (!/^[a-zA-Z0-9/_-]+\.mp4$/.test(videoPath)) {
    return null
  }

  return videoPath
}
