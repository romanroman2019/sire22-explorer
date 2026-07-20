import { LogIn, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface AuthButtonProps {
  collapsed?: boolean
}

export function AuthButton({ collapsed }: AuthButtonProps) {
  const { user, isAuthenticated, isLoading, signInWithGoogle, signOut } =
    useAuth()

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Loading auth">
        <User className="h-4 w-4" />
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={signInWithGoogle}
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign in</span>
      </Button>
    )
  }

  // Collapsed sidebar: avatar with dropdown for sign out
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.photoURL ?? ''}
                alt={user?.displayName ?? 'User avatar'}
              />
              <AvatarFallback>
                {user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">
                {user?.displayName ?? 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email ?? ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Expanded sidebar: inline user info + sign out button
  return (
    <div className="flex items-center gap-2 w-full">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={user?.photoURL ?? ''}
          alt={user?.displayName ?? 'User avatar'}
        />
        <AvatarFallback>
          {user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none truncate">
          {user?.displayName ?? 'User'}
        </p>
        <p className="text-xs leading-none text-muted-foreground truncate mt-0.5">
          {user?.email ?? ''}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        aria-label="Sign out"
        className="shrink-0"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
