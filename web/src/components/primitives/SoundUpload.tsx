import { useS3Upload } from 'next-s3-upload'
import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaExclamationCircle, FaFileUpload, FaSpinner } from 'react-icons/fa'
import toast from 'react-hot-toast'
import SoundPlayer from './SoundPlayer'
import { useDebounce } from '../hooks/useDebounce'

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
    multiple: false,
    accept: {
      'audio/ogg': [],
      'audio/mp3': [],
    },
    onFileDialogOpen: () => {
      setIsLoading(true)
    },
    onFileDialogCancel: () => {
      setIsLoading(false)
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
        toast.success('Uploaded')
      } catch (e) {
        console.error('[image:error]', e)
        toast.error('Error, please try again')
      } finally {
        setIsLoading(false)
      }
    },
  })

  const [volume, setVolume] = useState(1)
  const debouncedVolume = useDebounce(volume, 1_000)
  useEffect(() => console.info('debounce', debouncedVolume), [debouncedVolume])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-2">
        <div {...getRootProps({})} className="flex flex-row gap-1 justify-center items-center">
          <input {...getInputProps()} />
          <div className="border-dashed border border-orange-400 rounded-md h-10 w-14 flex justify-center items-center text-orange-400 bg-gray-100 cursor-pointer">
            {isLoading ? <FaSpinner className="animate animate-spin" /> : <FaFileUpload />}
          </div>
        </div>
        {existingSound || savedFile ? (
          <SoundPlayer src={existingSound || savedFile} volume={volume} onVolumeChange={setVolume} />
        ) : null}
      </div>
      {fileRejections.length > 0 ? (
        <div className="bg-red-500 text-white rounded-md px-2 flex flex-row gap-1 justify-center items-center text-sm">
          <FaExclamationCircle /> Max 5mb, .mp3 or .ogg
        </div>
      ) : null}
    </div>
  )
}
