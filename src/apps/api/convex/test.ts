import { query } from "./_generated/server";

export const test = query({
  handler: () => {
    console.log("fuck you, it worked")
    return "hi"
  }
})
