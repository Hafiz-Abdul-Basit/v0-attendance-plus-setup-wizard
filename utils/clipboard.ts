import { toast } from "sonner"

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!", {
      style: {
        background: "#10b981",
        color: "white",
        border: "none",
      },
    })
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand("copy")
      toast.success("Copied to clipboard!")
    } catch (fallbackErr) {
      toast.error("Failed to copy to clipboard")
    }
    document.body.removeChild(textArea)
  }
}
