import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocalStorage } from '@uidotdev/usehooks'
import Select from 'react-select'
import { FaImage, FaSyncAlt } from 'react-icons/fa'
import { SketchPicker } from 'react-color'
import html2canvas from 'html2canvas'
import { DEFAULT_CONFIG } from '~/util/list'

const KEY = 'herald-list-config/v1.1'

export function useListConfig() {
  return useLocalStorage(KEY, DEFAULT_CONFIG)
}

type hookReturn = ReturnType<typeof useListConfig>
interface ConfigProps {
  config: hookReturn[0]
  setConfig: hookReturn[1]
}
type Props = ConfigProps & {
  twitch: string
  patreonCampaignId: string
}

function TextInput({ name, config, setConfig }: { name: string } & ConfigProps) {
  return (
    <div className="flex flex-row justify-center items-center flex-1" style={{ height: 38 }}>
      <label className="bg-orange-500 border-orange-500 border text-white px-2 py-1 rounded-l-md capitalize h-full flex items-center justify-center">
        {name.split(/(?=[A-Z])/).join(' ')}
      </label>
      <input
        className="border border-orange-500 px-2 py-1 rounded-r-md bg-gray-100 flex-1 h-full"
        type="text"
        placeholder={`${name}...`}
        autoComplete="off"
        value={config[name]}
        onChange={(e) => setConfig((c) => ({ ...c, [name]: e.target.value }))}
      />
    </div>
  )
}

function Dropdown({
  name,
  config,
  setConfig,
  options,
}: { name: string; options: { value: any; label: string }[] } & ConfigProps) {
  const selected = options.find((o) => o.value === config[name])
  return (
    <div className="flex flex-row justify-center items-center flex-1">
      <label
        className="bg-orange-500 border-orange-500 border text-white px-2 rounded-l-md capitalize flex items-center justify-center"
        style={{ height: 38 }}
      >
        {name.split(/(?=[A-Z])/).join(' ')}
      </label>
      <Select
        name={name}
        value={selected}
        options={options}
        onChange={(selected) => setConfig((c) => ({ ...c, [name]: selected?.value }))}
        styles={{
          container: (styles) => ({ ...styles, flex: 1 }),
          control: (styles) => ({
            ...styles,
            border: '1px solid #F97316',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }),
          singleValue: (styles) => ({
            ...styles,
            fontFamily: name.toLowerCase().includes('font') ? selected?.value : styles.fontFamily,
          }),
          option: (styles, { data }) => ({
            ...styles,
            fontFamily: name.toLowerCase().includes('font') ? data.value : styles.fontFamily,
          }),
        }}
      />
    </div>
  )
}

function Color({ name, config, setConfig }: { name: string } & ConfigProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 items-center">
      <label
        className="bg-orange-500 border-orange-500 border text-white px-2 py-1 capitalize rounded-md flex items-center justify-center"
        style={{ height: 38 }}
      >
        {name.split(/(?=[A-Z])/).join(' ')}
      </label>
      <SketchPicker
        presetColors={[]}
        disableAlpha
        color={config[name]}
        onChangeComplete={(color) => setConfig((c) => ({ ...c, [name]: color.hex }))}
      />
    </div>
  )
}

const FONT_OPTIONS = [
  { label: '1942', value: '1942' },
  { label: 'Action Man', value: 'ActionMan' },
  { label: 'Arial', value: 'Arial' },
  { label: 'BadScript', value: 'BadScript' },
  { label: 'Baloo', value: 'Baloo' },
  { label: 'Berkshire Wash', value: 'BerkshireWash' },
  { label: 'Caviar Dreams', value: 'CaviarDreams' },
  { label: 'Great Vibes', value: 'GreatVibes' },
  { label: 'Guild Wars 2', value: 'GwTwo' },
  { label: 'JINKY', value: 'JINKY' },
  { label: 'Lato', value: 'Lato' },
  { label: 'League Gothic', value: 'LeagueGothic' },
  { label: 'League Spartan', value: 'LeagueSpartan' },
  { label: 'Lobster', value: 'Lobster' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Norwester', value: 'Norwester' },
  { label: 'Quicksand', value: 'Quicksand' },
  { label: 'Reey', value: 'Reey' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Seaside Resort', value: 'SeasideResort' },
  { label: 'Source Code Pro', value: 'SourceCodePro' },
  { label: 'Source Sans Pro', value: 'SourceSansPro' },
]

export function ListEditor({ config, setConfig, twitch, patreonCampaignId }: Props) {
  const [previewConfig, setPreviewConfig] = useState(() => new URLSearchParams(config))
  const currentConfigString = useMemo(() => new URLSearchParams(config).toString(), [config])
  const isPreviewAccurate = previewConfig.toString() === currentConfigString
  const iframeRef = useRef<HTMLIFrameElement>(null)
  return (
    <div className="flex flex-col gap-2 mt-2">
      <h3 className="text-xl">Edit List Overlay</h3>
      <div className="grid grid-cols-2 gap-2">
        <TextInput name="title" config={config} setConfig={setConfig} />
        <Dropdown
          name="tierOrdering"
          config={config}
          setConfig={setConfig}
          options={[
            { label: 'Highest to Lowest', value: 'highestFirst' },
            { label: 'Lowest to Highest', value: 'lowestFirst' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Dropdown
          name="showFreeTier"
          config={config}
          setConfig={setConfig}
          options={[
            { label: 'Hide Free Tier', value: 'hide' },
            { label: 'Show Free Tier', value: 'show' },
          ]}
        />
        <Dropdown
          name="patreonsName"
          config={config}
          setConfig={setConfig}
          options={[
            { label: 'Prefer Patreon', value: 'preferPatreon' },
            { label: 'Prefer Twitch', value: 'preferTwitch' },
          ]}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Dropdown name="titleFont" config={config} setConfig={setConfig} options={FONT_OPTIONS} />
        <Dropdown name="tierFont" config={config} setConfig={setConfig} options={FONT_OPTIONS} />
        <Dropdown name="patreonsFont" config={config} setConfig={setConfig} options={FONT_OPTIONS} />
        <Color name="titleColor" config={config} setConfig={setConfig} />
        <Color name="tierColor" config={config} setConfig={setConfig} />
        <Color name="patreonsColor" config={config} setConfig={setConfig} />
      </div>
      <div className="text-center bg-red-600 text-white rounded-md inline-block mx-auto px-5 py-1 mt-2">
        Make sure to get the new overlay URL from above when you're done!
      </div>
      <div className="flex flex-row items-center justify-center gap-2 my-2">
        <button onClick={() => setPreviewConfig(new URLSearchParams(config))}>
          <FaSyncAlt /> Update Preview
        </button>
        <button
          onClick={async () => {
            if (!iframeRef.current?.contentWindow?.document.body) return
            const _throwaway = await html2canvas(iframeRef.current?.contentWindow?.document.body, {
              backgroundColor: null,
            })
            const canvas = await html2canvas(iframeRef.current?.contentWindow?.document.body, { backgroundColor: null })
            const link = document.createElement('a')
            link.download = 'patreon-list.png'
            link.href = canvas.toDataURL('image/png')
            link.click()
          }}
        >
          <FaImage /> Download as image
        </button>
      </div>
      <div className="relative">
        {isPreviewAccurate ? null : (
          <div className="rounded-md absolute inset-0 flex justify-center items-center text-center font-bold text-2xl bg-red-500 bg-opacity-50 backdrop-blur-sm">
            Out of date preview, please refresh
          </div>
        )}
        <iframe
          src={`/obs/patreon/${twitch}/${patreonCampaignId}?${previewConfig}`}
          className="w-full bg-gray-100 rounded-md"
          height={500}
        />
        {createPortal(
          <iframe
            ref={iframeRef}
            src={`/obs/patreon/${twitch}/${patreonCampaignId}?${previewConfig}`}
            className="w-full h-full bg-gray-100 rounded-md absolute inset-0 -z-50 invisible"
          />,
          document.body
        )}
      </div>
    </div>
  )
}
