// quartz/components/scripts/alarm.inline.ts

document.addEventListener("nav", () => {
  // "nav" is a custom Quartz event that fires on page load/navigation
  console.log("Alarm script active")
  alert("This is your script file running!")
})
