// quartz/components/scripts/alarm.inline.ts

function setupCheckboxes() {
  console.log("deactivating checkboxes")
  const checkboxes = document.querySelectorAll('input[type="checkbox"][disabled]') as NodeListOf<HTMLInputElement>
  checkboxes.forEach(cb => {
    cb.removeAttribute("disabled")
    
    // Optional: Save state to local storage so it persists on refresh
    const id = cb.parentElement?.innerText.trim() // Use text as a unique key
    if (id) {
      cb.checked = localStorage.getItem(id) === 'true'
      cb.addEventListener('change', () => {
        localStorage.setItem(id, cb.checked.toString())
      })
    }
  })
}

// quartz/components/scripts/progress.inline.ts

function setupProgressAndCheckboxes() {
  // 1. Inject the Progress Bar Container if missing
  let progressContainer = document.getElementById("page-progress-container")
  if (!progressContainer) {
    progressContainer = document.createElement("div")
    progressContainer.id = "page-progress-container"
    progressContainer.innerHTML = '<div class="progress-fill"></div>'
    document.body.prepend(progressContainer)
  }
  const progressFill = progressContainer.querySelector(".progress-fill") as HTMLElement

  // 2. Select and Enable Checkboxes (Your logic + Progress calculation)
  const checkboxes = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
  const total = checkboxes.length
  
  // Helper to update the bar width
  const updateProgressBar = () => {
    if (total === 0) {
      progressFill.style.width = "0%"
      return
    }
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length
    const percentage = (checkedCount / total) * 100
    progressFill.style.width = `${percentage}%`
  }

  checkboxes.forEach(cb => {
    // Only process disabled ones (the default markdown checkboxes)
    if (cb.disabled) {
      cb.removeAttribute("disabled")
      
      const id = cb.parentElement?.innerText.trim()
      if (id) {
        // Load state
        const savedState = localStorage.getItem(id) === 'true'
        cb.checked = savedState
        
        // Save state on change & Update Bar
        cb.addEventListener('change', () => {
          localStorage.setItem(id, cb.checked.toString())
          updateProgressBar()
          updateGlobalWidget() // Update global counter if it exists
        })
      }
    }
  })

  // Initial bar update
  updateProgressBar()

  // 3. Global Progress Widget (Only runs on Index Page)
  if (window.location.pathname === "/" || window.location.pathname === "/index") {
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
    if (key && localStorage.getItem(key) === 'true') {
      totalCompleted++
    }
  }

  widget.innerText = `🏆 Total Global Tasks Completed: ${totalCompleted}`
}

function setupFolding() {
  // Select all H1s inside the main article content
  // We use the "article" selector to avoid targeting headers in sidebars/footers
  const headers = document.querySelectorAll("article h1")

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
    // We gather all next siblings until we hit another H1 or end of container
    const contentElements: Element[] = []
    let nextSibling = header.nextElementSibling

    while (nextSibling && nextSibling.tagName !== "H1") {
      contentElements.push(nextSibling)
      nextSibling = nextSibling.nextElementSibling
    }

    // 4. Set Default State: Folded (Hidden)
    // We do NOT add the 'expanded' class, and we ADD 'content-hidden'
    contentElements.forEach((el) => {
        if(el instanceof HTMLElement) {
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
// document.addEventListener("nav", setupCheckboxes)
document.addEventListener("nav", setupProgressAndCheckboxes)
document.addEventListener("nav", setupFolding)
