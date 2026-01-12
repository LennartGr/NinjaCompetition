// quartz/components/MyScript.tsx
import { QuartzComponent, QuartzComponentConstructor } from "./types"

// Import the script as a string
// Note: Quartz handles the .inline extension automatically
import script from "./scripts/own-scripts/on-every-page.inline"

const MyScript: QuartzComponent = () => {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

export default (() => MyScript) satisfies QuartzComponentConstructor
