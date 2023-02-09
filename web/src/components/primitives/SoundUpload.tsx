import { useS3Upload } from 'next-s3-upload'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaSpinner } from 'react-icons/fa'
import SoundPlayer from './SoundPlayer'

const ONE_MB = 1000000

export default function SoundUpload({
  campaignId,
  patronId,
  existingSound,
  autoApprove,
  refetch,
}: {
  campaignId: string
  patronId: string
  existingSound?: string
  autoApprove?: boolean
  refetch: () => void
}) {
  const [savedFile, setSavedFile] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const { uploadToS3, resetFiles } = useS3Upload({})

  const { getRootProps, fileRejections, getInputProps } = useDropzone({
    maxFiles: 1,
    maxSize: ONE_MB * 5,
    accept: {
      'audio/ogg': [],
      'audio/mp3': [],
    },
    onDrop: async (acceptedFiles) => {
      setIsLoading(true)
      try {
        console.info('[send]', { campaignId, patronId })
        const { url } = await uploadToS3(acceptedFiles[0], {
          endpoint: {
            request: {
              headers: {},
              body: {
                campaignId,
                patronId,
              },
            },
          },
        })
        const imagePath = new URL(url).pathname
        await fetch(`/api/internal/campaign/${campaignId}/${patronId}${autoApprove ? '?autoApprove=1' : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patreonId: patronId,
            sound: imagePath,
          }),
        })
        refetch()
        setSavedFile(`https://files.mael-cdn.com${imagePath}`)
        resetFiles()
      } catch (e) {
        console.error('[image:error]', e)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <section>
      <div {...getRootProps({})}>
        <input {...getInputProps()} />
        {fileRejections.length > 0 ? (
          <div>File too large! Only files up to 5mb are allowed</div>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      {existingSound || savedFile ? <SoundPlayer src={existingSound || savedFile} /> : null}
      {isLoading ? <FaSpinner className="animate animate-spin" /> : null}
    </section>
  )
}
