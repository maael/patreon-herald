import { PropsWithChildren } from 'react'
import cls from 'classnames'
import TrumpetSvg from './TrumpetSvg'

export default function Banner({
  children,
  iconCount = 24,
  className,
}: PropsWithChildren<{ iconCount?: number; className?: string }>) {
  return (
    <div
      className={cls(
        'bg-orange-400 grid grid-cols-6 md:grid-cols-8 justify-center items-center h-1/3 relative drop-shadow-xl',
        className
      )}
    >
      {Array.from({ length: iconCount }).map((_, i) => (
        <div key={i} className="flex flex-1 justify-center items-center">
          <TrumpetSvg width={'8vmin'} height={'8vmin'} className="fill-white drop-shadow" />
        </div>
      ))}
      <div className="absolute inset-1">
        <div className="flex justify-center items-center h-full">
          <div className="bg-orange-400 text-white px-12 py-4 text-center flex flex-col justify-center items-center gap-3 bg-opacity-70">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
