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
document.addEventListener("nav", setupCheckboxes)
document.addEventListener("nav", setupFolding)
