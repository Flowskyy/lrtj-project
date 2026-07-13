import { createUploadthing } from "uploadthing/next"

const f = createUploadthing()

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      // TODO: Add authentication middleware
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete for file:", file.url)
      return { uploadedBy: "user" }
    }),
}

export type OurFileRouter = typeof uploadRouter
