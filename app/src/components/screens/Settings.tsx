import * as React from 'react'
import { FaDownload, FaExclamationTriangle, FaPlus } from 'react-icons/fa'
import { Settings } from '~/utils'
import { APP_VERSION, checkForUpdate } from '~/utils/updates'

export default function SettingsScreen({
  settings,
  setSettings,
}: {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}) {
  return (
    <div className="mt-2 flex flex-col gap-3 flex-1 pb-2">
      <h1 className="text-3xl -mb-1">Settings</h1>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex-1">
            <h2 className="text-xl">
              Blocklist <small>({[].length})</small>
            </h2>
            <small className="text-m">These users will be excluded from giveaways</small>
          </div>
          <button
            className="border border-purple-600 rounded-md px-3 flex flex-row gap-1 justify-center items-center"
            onClick={() => setSettings((s) => ({ ...s, blocklist: [''].concat('') }))}
          >
            <FaPlus /> Add Item
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-end gap-2">
        <div className="flex-1">
          <button
            className="text-purple-200 opacity-80 text-xs"
            onClick={() => Neutralino.os.open(`https://github.com/maael/giveaway-o-tron/releases/v${APP_VERSION}`)}
          >
            Version: {APP_VERSION ? `v${APP_VERSION}` : 'Unknown Version'}
          </button>
        </div>
        <button
          className="bg-purple-600 px-3 py-1 rounded-md opacity-50 hover:opacity-100 flex justify-center items-center gap-1 transition-opacity text-xs"
          onClick={async () => {
            await checkForUpdate()
          }}
        >
          <FaDownload /> Check for update
        </button>
        <button
          className="bg-red-600 px-3 py-1 rounded-md opacity-50 hover:opacity-100 flex justify-center items-center gap-1 transition-opacity text-xs"
          onClick={async () => {
            Neutralino.os.open(`https://giveaway-o-tron.vercel.app/api/auth/signout`)
          }}
        >
          <FaExclamationTriangle /> Sign Out Token Tool
        </button>
        <button
          className="bg-red-600 px-3 py-1 rounded-md opacity-50 hover:opacity-100 flex justify-center items-center gap-1 transition-opacity text-xs"
          onClick={async () => {
            try {
              await Neutralino.storage.setData('main-channelinfo', null)
              await await Neutralino.filesystem.readDirectory(`${NL_CWD}/.storage/main-channelinfo.neustorage`)
              await Neutralino.app.restartProcess({ args: '--restarted' })
            } catch {
              await Neutralino.app.restartProcess({ args: '--restarted' })
            }
          }}
        >
          <FaExclamationTriangle /> Reset Channel Info
        </button>
      </div>
    </div>
  )
}
