import { PropsWithChildren } from 'react'
import TrumpetSvg from './TrumpetSvg'

const iconSize = '8vmin'

export default function Banner({ children }: PropsWithChildren<{}>) {
  return (
    <div className={'bg-orange-400 flex flex-row justify-center items-center relative drop-shadow-xl text-white'}>
      <div className="flex-1 text-center flex flex-row justify-around items-center">
        <TrumpetSvg
          width={iconSize}
          height={iconSize}
          className="fill-white drop-shadow hidden sm:block transform -scale-x-100"
        />
        <TrumpetSvg
          width={iconSize}
          height={iconSize}
          className="fill-white drop-shadow hidden lg:block transform -scale-x-100"
        />
        <TrumpetSvg
          width={iconSize}
          height={iconSize}
          className="fill-white drop-shadow hidden xl:block transform -scale-x-100"
        />
      </div>
      <div className="text-center py-2 sm:py-6">{children}</div>
      <div className="flex-1 text-center flex flex-row justify-around items-center">
        <TrumpetSvg width={iconSize} height={iconSize} className="fill-white drop-shadow hidden sm:block" />
        <TrumpetSvg width={iconSize} height={iconSize} className="fill-white drop-shadow hidden lg:block" />
        <TrumpetSvg width={iconSize} height={iconSize} className="fill-white drop-shadow hidden xl:block" />
      </div>
    </div>
  )
}
