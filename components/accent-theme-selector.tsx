'use client'

import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'

export function AccentThemeSelector() {
  const { accentTheme, setAccentTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Select accent theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Accent Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setAccentTheme('default')}
          className={accentTheme === 'default' ? 'bg-accent' : ''}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-foreground/20 bg-background" />
            <span>Default</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setAccentTheme('blue')}
          className={accentTheme === 'blue' ? 'bg-accent' : ''}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
            <span>Blue</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setAccentTheme('gray')}
          className={accentTheme === 'gray' ? 'bg-accent' : ''}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-500" />
            <span>Gray</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
