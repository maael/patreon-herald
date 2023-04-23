/* eslint-disable @next/next/no-img-element */
import { ComponentProps } from 'react'
import { GroupBase, OptionProps, SingleValueProps, StylesConfig } from 'react-select'
import AsyncSelect from 'react-select/async'
import cls from 'classnames'
import { toast } from 'react-hot-toast'
import { FaTwitch } from 'react-icons/fa'

function TwitchUserOptionInner({
  data,
  selectProps,
  innerProps,
  ...props
}: Partial<{
  data: { label: string; image: string } | unknown
  selectProps: { menuIsOpen: boolean }
  innerProps: any
}>) {
  const { label, image } = data as { label: string; image: string }
  const isSelected = (props as any).isSelected
  return isSelected === undefined && selectProps?.menuIsOpen ? null : (
    <div
      className={cls(
        'flex flex-row gap-1.5 items-center px-2 py-1 cursor-pointer hover:bg-gray-200 text-ellipsis whitespace-nowrap max-w-full',
        {
          'absolute inset-0': isSelected === undefined,
          'bg-green-200': isSelected,
        }
      )}
      {...innerProps}
    >
      {isSelected === undefined ? <FaTwitch className="text-purple-600 text-lg" /> : null}
      <img
        className="rounded-full w-7 aspect-square drop-shadow-lg border-2 border-purple-600"
        src={image || undefined}
        title={`${label}`}
      />
      <div className="text-black text-lg drop-shadow-lg text-ellipsis whitespace-nowrap max-w-full">{label}</div>
    </div>
  )
}

function TwitchUserOption({ ...props }: OptionProps | SingleValueProps) {
  return <TwitchUserOptionInner {...props} />
}

const selectComponents: ComponentProps<typeof AsyncSelect>['components'] = {
  Option: TwitchUserOption,
  SingleValue: TwitchUserOption,
}

const stylesConfig: StylesConfig<unknown, boolean, GroupBase<unknown>> = {
  control: (baseStyles, _state) => ({
    ...baseStyles,
    borderRadius: '0.4rem',
    paddingTop: '0.2rem',
    paddingBottom: '0.2rem',
  }),
  indicatorSeparator: () => ({}),
  menuList: (baseStyles) => ({
    ...baseStyles,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
  option: (baseStyles) => ({
    ...baseStyles,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
}

export default function TwitchUserSearch({
  patreonId,
  existing,
}: {
  patreonId: string
  existing?: { label: string; username: string; image: string; value: number }
}) {
  return (
    <div className="w-full md:w-1/2">
      <AsyncSelect
        styles={stylesConfig}
        placeholder={existing ? <TwitchUserOptionInner data={existing} /> : 'Search for Twitch user....'}
        components={selectComponents}
        onChange={async (d: { label: string; image: string; username: string; value: string }) => {
          try {
            const result = await fetch(`/api/internal/connection/${patreonId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: d.value,
                username: d.username || d.label,
                displayName: d.label,
                image: d.image,
              }),
            })
            const resultData = await result.json()
            if (!resultData.success) throw new Error('Unexpected error')
            toast.success('Saved')
          } catch (e) {
            console.error(e)
            toast.error('Something went wrong!')
          }
        }}
        noOptionsMessage={() => 'No options, type to search'}
        cacheOptions
        loadOptions={async (inputValue: string) => {
          try {
            return fetch(`/api/internal/twitch?search=${inputValue}`)
              .then((r) => r.json())
              .then((r) => {
                return r.data.map((d) => ({
                  label: d.display_name,
                  username: d.broadcaster_login,
                  image: d.thumbnail_url,
                  value: d.id,
                }))
              })
          } catch (e) {
            console.error(e)
            return []
          }
        }}
        defaultOptions={[]}
      />
    </div>
  )
}
