// quartz/components/scripts/alarm.inline.ts

document.addEventListener("nav", () => {
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
})
