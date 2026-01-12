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


function setupLocalProgress() {
  // 1. cleanup old widget if navigation happened
  const existingWidget = document.getElementById("local-progress-widget")
  if (existingWidget) existingWidget.remove()

  // 2. Scan for checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>
  
  // Filter for valid checkboxes (e.g. ones that were disabled markdown ones)
  // or just use all of them. Let's assume we want all.
  const relevantCheckboxes: HTMLInputElement[] = []
  checkboxes.forEach(cb => {
      // Logic to identify if this is a "task" checkbox. 
      // Usually all checkboxes in markdown are tasks.
      relevantCheckboxes.push(cb)
  })

  const total = relevantCheckboxes.length

  // If no tasks, do nothing
  if (total === 0) return

  // 3. Create Widget HTML matching the sketch
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

  // 4. Append to the bottom of the content
  const content = document.querySelector(".popover-hint") || document.querySelector("article") || document.querySelector(".center")
  if (content) {
    content.appendChild(widget)
  }

  // 5. Update Logic
  const progressFill = widget.querySelector(".progress-fill") as HTMLElement
  const progressText = widget.querySelector(".progress-text") as HTMLElement

  const updateState = () => {
    const checkedCount = relevantCheckboxes.filter(cb => cb.checked).length
    const percentage = Math.round((checkedCount / total) * 100)
    
    // Update visuals
    progressFill.style.width = `${percentage}%`
    progressText.innerText = `${checkedCount}/${total} (${percentage}%)`
    
    // Optional: Visual flair - change color if complete?
    if (percentage === 100) {
        progressFill.style.backgroundColor = "var(--tertiary)" // Success color
    }
  }

  // 6. Bind Events
  relevantCheckboxes.forEach(cb => {
    // Ensure we handle the disabled state removal like before
    if (cb.disabled) {
       cb.removeAttribute("disabled")
       const id = cb.parentElement?.innerText.trim()
       if (id) {
         cb.checked = localStorage.getItem(id) === 'true'
         cb.addEventListener('change', () => {
           localStorage.setItem(id, cb.checked.toString())
           updateState()
           updateGlobalWidget() // Keep your global index logic if you still use it
         })
       }
    } else {
        // If it was already enabled (custom html), just bind listener
        cb.addEventListener('change', updateState)
    }
  })

  // Initial call
  updateState()
  
  // Keep your Global Widget logic for the Index page here if desired...
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
document.addEventListener("nav", setupLocalProgress)
document.addEventListener("nav", setupFolding)
