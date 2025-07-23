import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Database, LogOut, Settings, User } from 'lucide-react'
import { blink } from '@/blink/client'
import type { User as UserType } from '@/types'

interface TopNavigationProps {
  currentBase?: { name: string; color: string }
}

export function TopNavigation({ currentBase }: TopNavigationProps) {
  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
      {/* Left side - Logo and current base */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">AirClone</span>
        </div>
        
        {currentBase && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: currentBase.color }}
              />
              <span className="font-medium">{currentBase.name}</span>
            </div>
          </>
        )}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.email}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}